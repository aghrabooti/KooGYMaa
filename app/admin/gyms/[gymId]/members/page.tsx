import { AddPersonForm } from "@/components/admin/add-person-form";
import { StatusActions } from "@/components/admin/status-actions";
import { BulkBar, Pagination } from "@/components/admin/data-table";
import { Icon } from "@/components/icon";
import { requireGymAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { faStatus } from "@/components/fa";

type PageProps = {
  params: Promise<{ gymId: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

const PAGE_SIZE = 20;

export default async function MembersPage({ params, searchParams }: PageProps) {
  const { gymId } = await params;
  await requireGymAdminAccess(gymId);
  const filters = await searchParams;
  const query = filters.q?.trim();
  const validStatuses = new Set(["PENDING", "ACTIVE", "REJECTED", "SUSPENDED", "EXPIRED", "CANCELLED"]);
  const status = filters.status && validStatuses.has(filters.status) ? filters.status : undefined;
  const page = Math.max(1, Number(filters.page) || 1);

  const where = {
    gymId,
    ...(status ? { status: status as "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "EXPIRED" | "CANCELLED" } : {}),
    ...(query ? { user: { OR: [{ name: { contains: query } }, { email: { contains: query } }] } } : {}),
  };

  const [memberships, grouped, total] = await Promise.all([
    prisma.gymMembership.findMany({
      where,
      select: {
        id: true, status: true, requestedAt: true, startedAt: true, expiresAt: true,
        user: {
          select: {
            name: true, email: true, phone: true,
            subscriptions: { where: { gymId, status: "ACTIVE" }, select: { endDate: true, plan: { select: { name: true } } }, orderBy: { endDate: "desc" }, take: 1 },
          },
        },
      },
      orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.gymMembership.groupBy({ by: ["status"], where: { gymId }, _count: true }),
    prisma.gymMembership.count({ where }),
  ]);
  const counts: Record<string, number> = Object.fromEntries(grouped.map((item: any) => [item.status, item._count]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const baseQuery = `?${[status ? `status=${status}` : "", query ? `q=${encodeURIComponent(query)}` : ""].filter(Boolean).join("&")}`;

  return (
    <div className="admin-page">
      <header className="admin-page__heading admin-page__heading--compact">
        <div><span>افراد</span><h1>اعضا</h1><p>درخواست‌ها را مرور کنید و دسترسی اعضا به این باشگاه را مدیریت کنید.</p></div>
        <AddPersonForm endpoint={`/api/admin/gyms/${gymId}/members`} kind="member" />
      </header>

      <section className="admin-summary-strip">
        <div><span>فعال</span><strong>{counts.ACTIVE || 0}</strong></div>
        <div><span>در انتظار</span><strong>{counts.PENDING || 0}</strong></div>
        <div><span>معلق</span><strong>{counts.SUSPENDED || 0}</strong></div>
        <div><span>مطابق فیلتر</span><strong>{total}</strong></div>
      </section>

      <section className="admin-panel admin-table-panel">
        <div className="admin-toolbar">
          <form><Icon name="search" size={17} /><input defaultValue={query} name="q" placeholder="جستجوی اعضا با نام یا ایمیل" /><button type="submit">جستجو</button></form>
          <div className="admin-filter-links">
            {["ALL", "PENDING", "ACTIVE", "SUSPENDED"].map((item) => (
              <a className={(item === "ALL" ? !status : status === item) ? "active" : ""} href={item === "ALL" ? `?${query ? `q=${encodeURIComponent(query)}` : ""}` : `?status=${item}${query ? `&q=${encodeURIComponent(query)}` : ""}`} key={item}>{item === "ALL" ? "همه" : faStatus(item)}</a>
            ))}
          </div>
          <a className="admin-secondary-button" href={`/api/admin/gyms/${gymId}/export?kind=members`}>⬇ CSV</a>
        </div>

        <BulkBar endpoint={`/api/admin/gyms/${gymId}/members/bulk`} label="عملیات گروهی اعضا" actions={[{ value: "ACTIVE", label: "تأیید گروهی" }, { value: "SUSPENDED", label: "تعلیق گروهی" }, { value: "CANCELLED", label: "لغو گروهی" }]} />

        {memberships.length ? (
          <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr><th><span className="sr-only">انتخاب</span></th><th>عضو</th><th>وضعیت</th><th>اشتراک</th><th>آغازشده</th><th>انقضا</th><th><span className="sr-only">اقدامات</span></th></tr></thead>
            <tbody>{memberships.map((membership: any) => {
              const subscription = membership.user.subscriptions[0];
              return <tr key={membership.id}>
                <td><input type="checkbox" data-bulk-id={membership.id} aria-label={`انتخاب ${membership.user.name}`} /></td>
                <td><div className="admin-person"><span>{membership.user.name.slice(0, 2).toUpperCase()}</span><div><strong>{membership.user.name}</strong><small>{membership.user.email}{membership.user.phone ? ` · ${membership.user.phone}` : ""}</small></div></div></td>
                <td><span className={`admin-status admin-status--${membership.status.toLowerCase()}`}>{faStatus(membership.status)}</span></td>
                <td>{subscription ? <div className="admin-table-stack"><strong>{subscription.plan.name}</strong><small>تا {formatDate(subscription.endDate)}</small></div> : <span className="admin-muted">برنامه فعالی وجود ندارد</span>}</td>
                <td>{formatDate(membership.startedAt)}</td>
                <td>{formatDate(membership.expiresAt)}</td>
                <td><StatusActions endpoint={`/api/admin/gyms/${gymId}/members/${membership.id}`} status={membership.status} /></td>
              </tr>;
            })}</tbody>
          </table></div>
        ) : <div className="admin-empty-table"><span><Icon name="users" size={27} /></span><h2>عضوی یافت نشد</h2><p>با ایمیل عضو اضافه کنید یا فیلترها را عوض کنید.</p></div>}
        <Pagination page={page} totalPages={totalPages} base={baseQuery || "?"} />
      </section>
    </div>
  );
}
