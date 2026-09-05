import { CreateSubscription, SubscriptionActions } from "@/components/admin/subscription-controls";
import { BulkBar, Pagination } from "@/components/admin/data-table";
import { Icon } from "@/components/icon";
import { summarizePayments } from "@/lib/finance";
import { requireGymAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { faStatus } from "@/components/fa";

type PageProps = { params: Promise<{ gymId: string }>; searchParams: Promise<{ q?: string; status?: string; page?: string }> };

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("fa-IR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toLocaleString("fa-IR")} ${currency}`;
  }
}

function date(value: Date) {
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

const PAGE_SIZE = 20;

export default async function SubscriptionsPage({ params, searchParams }: PageProps) {
  const { gymId } = await params;
  await requireGymAdminAccess(gymId);
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const filters = await searchParams;
  const query = filters.q?.trim();
  const validStatuses = new Set(["PENDING", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED"]);
  const status = filters.status && validStatuses.has(filters.status) ? filters.status : undefined;
  const page = Math.max(1, Number(filters.page) || 1);
  const where = { gymId, ...(status ? { status: status as "PENDING" | "ACTIVE" | "PAST_DUE" | "EXPIRED" | "CANCELLED" } : {}), ...(query ? { subscriber: { OR: [{ name: { contains: query } }, { email: { contains: query } }] } } : {}) };

  const [subscriptions, plans, total, payments] = await Promise.all([
    prisma.subscription.findMany({
      where,
      select: {
        id: true,
        status: true,
        pricePaid: true,
        currency: true,
        startDate: true,
        endDate: true,
        autoRenew: true,
        subscriber: { select: { name: true, email: true, role: true } },
        plan: { select: { name: true, audience: true } },
      },
      orderBy: [{ status: "asc" }, { endDate: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.subscriptionPlan.findMany({
      where: { gymId, isActive: true },
      select: { id: true, name: true, audience: true },
      orderBy: [{ audience: "asc" }, { price: "asc" }],
    }),
    prisma.subscription.count({ where }),
    prisma.payment.findMany({ where: { gymId }, select: { status: true, type: true, amount: true, currency: true, paidAt: true, createdAt: true } }),
  ]);
  const active = subscriptions.filter((item: any) => item.status === "ACTIVE" && item.endDate > now);
  const expiring = active.filter((item: any) => item.endDate <= soon);
  // Item 3: revenue from SUCCEEDED payments (per currency, renewals + refunds).
  const finance = summarizePayments(payments as any[]);
  const currency = finance.currency;
  const revenue = finance.net;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const baseQuery = `?${[status ? `status=${status}` : "", query ? `q=${encodeURIComponent(query)}` : ""].filter(Boolean).join("&")}`;

  return (
    <div className="admin-page">
      <header className="admin-page__heading admin-page__heading--compact">
        <div><span>پرداخت و دسترسی</span><h1>اشتراک‌ها</h1><p>دسترسی اعضا و مربی‌ها را فعال، تمدید و لغو کنید.</p></div>
        <CreateSubscription gymId={gymId} plans={plans} />
      </header>

      <section className="admin-summary-strip">
        <div><span>فعال</span><strong>{active.length}</strong></div>
        <div><span>منقضی‌شونده در این هفته</span><strong>{expiring.length}</strong></div>
        <div><span>تمدید خودکار</span><strong>{active.filter((item: any) => item.autoRenew).length}</strong></div>
        <div><span>درآمد خالص پرداخت‌شده</span><strong>{money(revenue, currency)}</strong></div>
      </section>
      {Object.keys(finance.byCurrency).length > 1 && <p className="admin-note">تفکیک ارز: {Object.entries(finance.byCurrency).map(([code, b]) => `${code}: خالص ${money(b.net, code)}`).join(" · ")}</p>}
      <p className="admin-note">تمدیدهای موفق: {finance.renewalsSucceeded} ({money(finance.renewalsRevenue, currency)}) · بازپرداخت‌ها: {money(finance.refunded, currency)}</p>

      <section className="admin-panel admin-table-panel">
        <div className="admin-toolbar">
          <form><Icon name="search" size={17} /><input defaultValue={query} name="q" placeholder="جستجو بر اساس مشترک" /><button type="submit">جستجو</button></form>
          <div className="admin-filter-links">
            {["ALL", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED"].map((item) => (
              <a className={(item === "ALL" ? !status : status === item) ? "active" : ""} href={item === "ALL" ? `?${query ? `q=${encodeURIComponent(query)}` : ""}` : `?status=${item}${query ? `&q=${encodeURIComponent(query)}` : ""}`} key={item}>{item === "ALL" ? "همه" : faStatus(item)}</a>
            ))}
          </div>
          <a className="admin-secondary-button" href={`/api/admin/gyms/${gymId}/export?kind=subscriptions`}>⬇ CSV</a>
        </div>
        <BulkBar endpoint={`/api/admin/gyms/${gymId}/subscriptions/bulk`} label="لغو گروهی اشتراک‌ها" actions={[{ value: "CANCELLED", label: "لغو گروهی" }]} />
        {subscriptions.length ? <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th><span className="sr-only">انتخاب</span></th><th>مشترک</th><th>طرح</th><th>وضعیت</th><th>پرداخت‌شده</th><th>بازه</th><th>تمدید</th><th><span className="sr-only">اقدامات</span></th></tr></thead>
          <tbody>{subscriptions.map((subscription: any) => <tr key={subscription.id}>
            <td><input type="checkbox" data-bulk-id={subscription.id} aria-label={`انتخاب ${subscription.subscriber.name}`} /></td>
            <td><div className="admin-person"><span>{subscription.subscriber.name.slice(0, 2).toUpperCase()}</span><div><strong>{subscription.subscriber.name}</strong><small>{subscription.subscriber.email} · {subscription.subscriber.role}</small></div></div></td>
            <td><div className="admin-table-stack"><strong>{subscription.plan.name}</strong><small>{subscription.plan.audience}</small></div></td>
            <td><span className={`admin-status admin-status--${subscription.status.toLowerCase().replace("_", "-")}`}>{faStatus(subscription.status)}</span></td>
            <td>{money(subscription.pricePaid, subscription.currency)}</td>
            <td><div className="admin-table-stack"><strong>{date(subscription.endDate)}</strong><small>From {date(subscription.startDate)}</small></div></td>
            <td>{subscription.autoRenew ? <span className="admin-renew"><Icon name="check" size={13} /> روشن</span> : <span className="admin-muted">خاموش</span>}</td>
            <td><SubscriptionActions autoRenew={subscription.autoRenew} endpoint={`/api/admin/gyms/${gymId}/subscriptions/${subscription.id}`} status={subscription.status} /></td>
          </tr>)}</tbody>
        </table></div> : <div className="admin-empty-table"><span><Icon name="credit-card" size={27} /></span><h2>هنوز اشتراکی ثبت نشده است</h2><p>پس از افزودن دست‌کم یک طرح، اشتراک بسازید.</p></div>}
        <Pagination page={page} totalPages={totalPages} base={baseQuery || "?"} />
      </section>
    </div>
  );
}
