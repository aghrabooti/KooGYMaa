import { AddPersonForm } from "@/components/admin/add-person-form";
import { StatusActions } from "@/components/admin/status-actions";
import { Icon } from "@/components/icon";
import { requireGymAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ gymId: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
};

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

export default async function MembersPage({ params, searchParams }: PageProps) {
  const { gymId } = await params;
  await requireGymAdminAccess(gymId);
  const filters = await searchParams;
  const query = filters.q?.trim();
  const validStatuses = new Set(["PENDING", "ACTIVE", "REJECTED", "SUSPENDED", "EXPIRED", "CANCELLED"]);
  const status = filters.status && validStatuses.has(filters.status) ? filters.status : undefined;

  const [memberships, grouped] = await Promise.all([
    prisma.gymMembership.findMany({
      where: {
        gymId,
        ...(status ? { status: status as "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "EXPIRED" | "CANCELLED" } : {}),
        ...(query ? { user: { OR: [{ name: { contains: query } }, { email: { contains: query } }] } } : {}),
      },
      select: {
        id: true,
        status: true,
        requestedAt: true,
        startedAt: true,
        expiresAt: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            subscriptions: {
              where: { gymId, status: "ACTIVE" },
              select: { endDate: true, plan: { select: { name: true } } },
              orderBy: { endDate: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
      take: 200,
    }),
    prisma.gymMembership.groupBy({ by: ["status"], where: { gymId }, _count: true }),
  ]);
  const counts = Object.fromEntries(grouped.map((item) => [item.status, item._count]));

  return (
    <div className="admin-page">
      <header className="admin-page__heading admin-page__heading--compact">
        <div><span>PEOPLE</span><h1>Members</h1><p>Review requests and manage member access to this gym.</p></div>
        <AddPersonForm endpoint={`/api/admin/gyms/${gymId}/members`} kind="member" />
      </header>

      <section className="admin-summary-strip">
        <div><span>Active</span><strong>{counts.ACTIVE || 0}</strong></div>
        <div><span>Pending</span><strong>{counts.PENDING || 0}</strong></div>
        <div><span>Suspended</span><strong>{counts.SUSPENDED || 0}</strong></div>
        <div><span>Total records</span><strong>{grouped.reduce((sum, item) => sum + item._count, 0)}</strong></div>
      </section>

      <section className="admin-panel admin-table-panel">
        <div className="admin-toolbar">
          <form><Icon name="search" size={17} /><input defaultValue={query} name="q" placeholder="Search members by name or email" /><button type="submit">Search</button></form>
          <div className="admin-filter-links">
            {["ALL", "PENDING", "ACTIVE", "SUSPENDED"].map((item) => (
              <a className={(item === "ALL" ? !status : status === item) ? "active" : ""} href={item === "ALL" ? `?${query ? `q=${encodeURIComponent(query)}` : ""}` : `?status=${item}${query ? `&q=${encodeURIComponent(query)}` : ""}`} key={item}>{item}</a>
            ))}
          </div>
        </div>

        {memberships.length ? (
          <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr><th>Member</th><th>Status</th><th>Subscription</th><th>Started</th><th>Expires</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{memberships.map((membership) => {
              const subscription = membership.user.subscriptions[0];
              return <tr key={membership.id}>
                <td><div className="admin-person"><span>{membership.user.name.slice(0, 2).toUpperCase()}</span><div><strong>{membership.user.name}</strong><small>{membership.user.email}{membership.user.phone ? ` · ${membership.user.phone}` : ""}</small></div></div></td>
                <td><span className={`admin-status admin-status--${membership.status.toLowerCase()}`}>{membership.status}</span></td>
                <td>{subscription ? <div className="admin-table-stack"><strong>{subscription.plan.name}</strong><small>Until {formatDate(subscription.endDate)}</small></div> : <span className="admin-muted">No active plan</span>}</td>
                <td>{formatDate(membership.startedAt)}</td>
                <td>{formatDate(membership.expiresAt)}</td>
                <td><StatusActions endpoint={`/api/admin/gyms/${gymId}/members/${membership.id}`} status={membership.status} /></td>
              </tr>;
            })}</tbody>
          </table></div>
        ) : <div className="admin-empty-table"><span><Icon name="users" size={27} /></span><h2>No members found</h2><p>Add a member by email or adjust your filters.</p></div>}
      </section>
    </div>
  );
}
