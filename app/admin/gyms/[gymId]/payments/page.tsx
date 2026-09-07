import { RefundButton } from "@/components/admin/payment-actions";
import { Icon } from "@/components/icon";
import { requireGymAdminAccess } from "@/lib/admin-access";
import { summarizePayments, monthlyRevenue } from "@/lib/finance";
import { formatMoney } from "@/lib/fa";
import { prisma } from "@/lib/prisma";
import { faStatus } from "@/components/fa";
import { faAudit, faEntity } from "@/components/fa";

type PageProps = { params: Promise<{ gymId: string }>; searchParams: Promise<{ status?: string; page?: string }> };

const PAGE_SIZE = 25;

export default async function AdminPaymentsPage({ params, searchParams }: PageProps) {
  const { gymId } = await params;
  const access = await requireGymAdminAccess(gymId);
  const filters = await searchParams;
  const validStatuses = new Set(["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "REFUNDED", "CANCELLED"]);
  const status = filters.status && validStatuses.has(filters.status) ? filters.status : undefined;
  const page = Math.max(1, Number(filters.page) || 1);
  const where = { gymId, ...(status ? { status: status as "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "REFUNDED" | "CANCELLED" } : {}) };

  const [payments, audit, allForFinance, total] = await Promise.all([
    prisma.payment.findMany({ where, select: { id: true, status: true, type: true, amount: true, currency: true, provider: true, paidAt: true, refundedAt: true, createdAt: true, user: { select: { name: true, email: true } }, plan: { select: { name: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.auditLog.findMany({ where: { gymId }, select: { id: true, action: true, entityType: true, entityId: true, metadata: true, createdAt: true, actor: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.payment.findMany({ where: { gymId }, select: { status: true, type: true, amount: true, currency: true, paidAt: true, createdAt: true } }),
    prisma.payment.count({ where }),
  ]);

  // Item 3: revenue ONLY from SUCCEEDED payments, per currency, renewals + refunds explicit.
  const finance = summarizePayments(allForFinance as any[]);
  const trend = monthlyRevenue(allForFinance as any[], 6, new Date());
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const baseQuery = status ? `?status=${status}` : "?";

  return (
    <div className="admin-page">
      <header className="admin-page__heading admin-page__heading--compact"><div><span>مالی و امنیت</span><h1>پرداخت‌ها و حسابرسی</h1><p>تراکنش‌ها، بازپرداخت‌ها و اقدامات حساس فضای کاری.</p></div><a className="admin-secondary-button" href={`/api/admin/gyms/${gymId}/export?kind=payments`}>⬇ CSV</a></header>

      <section className="admin-summary-strip">
        <div><span>موفق</span><strong>{finance.counts.succeeded}</strong></div>
        <div><span>در انتظار</span><strong>{finance.counts.pending}</strong></div>
        <div><span>بازپرداخت‌شده</span><strong>{finance.counts.refunded}</strong></div>
        <div><span>درآمد خالص (پرداخت‌شده)</span><strong>{formatMoney(finance.net, finance.currency)}</strong></div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__heading"><div><h2>درآمد بر اساس ارز</h2><p>فقط پرداخت‌های موفق · خالص پس از بازپرداخت · شامل تمدیدها</p></div></div>
        <div className="admin-currency-grid">
          {Object.entries(finance.byCurrency).map(([code, b]) => (
            <article key={code}><strong>{code}</strong><span>ناخالص {formatMoney(b.gross, code)}</span><span>بازپرداخت‌شده {formatMoney(b.refunded, code)}</span><b>خالص {formatMoney(b.net, code)}</b></article>
          ))}
          {!Object.keys(finance.byCurrency).length && <p className="admin-muted">هنوز سابقه پرداختی ثبت نشده است.</p>}
        </div>
        <p className="admin-note">تمدیدها: {finance.renewalsSucceeded} پرداخت موفق ({formatMoney(finance.renewalsRevenue, finance.currency)}) · بازپرداخت‌ها: {formatMoney(finance.refunded, finance.currency)} · روند ۶ ماهه: {trend.map((r) => `${r.key}: ${r.count}`).join(" · ")}</p>
      </section>

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel__heading payment-admin-heading"><div><h2>تراکنش‌ها</h2><p>{total} تراکنش · صفحه {page} از {totalPages}</p></div><Icon name="shield" size={18} /></div>
        <div className="admin-filter-links">
          {["ALL", "SUCCEEDED", "PENDING", "FAILED", "REFUNDED"].map((item) => (
            <a className={(item === "ALL" ? !status : status === item) ? "active" : ""} href={item === "ALL" ? "?" : `?status=${item}`} key={item}>{item === "ALL" ? "همه" : faStatus(item)}</a>
          ))}
        </div>
        {payments.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>مشتری</th><th>طرح</th><th>وضعیت</th><th>مبلغ</th><th>ارائه‌دهنده</th><th>تاریخ</th><th>اقدام</th></tr></thead><tbody>{payments.map((payment: any) => <tr key={payment.id}><td><div className="admin-person"><span>{payment.user.name.slice(0, 2).toUpperCase()}</span><div><strong>{payment.user.name}</strong><small>{payment.user.email}</small></div></div></td><td><div className="admin-table-stack"><strong>{payment.plan.name}</strong><small>{faStatus(payment.type)}</small></div></td><td><span className={`admin-status admin-status--${payment.status.toLowerCase()}`}>{faStatus(payment.status)}</span></td><td>{formatMoney(payment.amount, payment.currency)}</td><td>{payment.provider.toUpperCase()}</td><td>{(payment.paidAt || payment.createdAt).toLocaleDateString("fa-IR")}</td><td>{payment.status === "SUCCEEDED" && access.staffRole === "OWNER" ? <RefundButton gymId={gymId} paymentId={payment.id} /> : <span className="admin-muted">—</span>}</td></tr>)}</tbody></table></div> : <div className="admin-empty-table"><span><Icon name="credit-card" size={27} /></span><h2>هنوز پرداختی ثبت نشده است</h2><p>تراکنش‌های پرداخت اینجا نمایش داده می‌شوند.</p></div>}
        <nav className="admin-pagination" aria-label="صفحه‌بندی">
          {page > 1 && <a href={`${baseQuery}${baseQuery.includes("?") && baseQuery.length > 1 ? "&" : ""}page=${page - 1}`}>→ قبلی</a>}
          <span>صفحه {page} از {totalPages}</span>
          {page < totalPages && <a href={`${baseQuery}${baseQuery.includes("?") && baseQuery.length > 1 ? "&" : ""}page=${page + 1}`}>بعدی ←</a>}
        </nav>
      </section>

      <section className="admin-panel audit-timeline"><div className="admin-panel__heading"><div><h2>سوابق حسابرسی</h2><p>آخرین اقدامات حساس</p></div></div><div>{audit.map((entry: any) => <article key={entry.id}><span><Icon name="shield" size={15} /></span><div><strong>{faAudit(entry.action)}</strong><small>{entry.actor?.name || "سیستم"} · {faEntity(entry.entityType)} · {entry.entityId.slice(0, 12)}</small></div><time>{entry.createdAt.toLocaleString("fa-IR")}</time></article>)}</div></section>
    </div>
  );
}
