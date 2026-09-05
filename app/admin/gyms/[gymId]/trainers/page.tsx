import { AddPersonForm } from "@/components/admin/add-person-form";
import { StatusActions } from "@/components/admin/status-actions";
import { BulkBar, Pagination } from "@/components/admin/data-table";
import { Icon } from "@/components/icon";
import { requireGymAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ gymId: string }>; searchParams: Promise<{ q?: string; status?: string; page?: string }> };

function formatMoney(value: number | null, currency: string) {
  if (value === null) return "Rate not set";
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}

const PAGE_SIZE = 20;

export default async function TrainersPage({ params, searchParams }: PageProps) {
  const { gymId } = await params;
  const access = await requireGymAdminAccess(gymId);
  const filters = await searchParams;
  const query = filters.q?.trim();
  const validStatuses = new Set(["PENDING", "ACTIVE", "REJECTED", "SUSPENDED", "EXPIRED", "CANCELLED"]);
  const status = filters.status && validStatuses.has(filters.status) ? filters.status : undefined;
  const page = Math.max(1, Number(filters.page) || 1);
  const where = { gymId, ...(status ? { status: status as "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "EXPIRED" | "CANCELLED" } : {}), ...(query ? { trainer: { user: { OR: [{ name: { contains: query } }, { email: { contains: query } }] } } } : {}) };

  const [trainers, grouped, total] = await Promise.all([
    prisma.gymTrainer.findMany({
      where,
      select: {
        id: true,
        status: true,
        requestedAt: true,
        startedAt: true,
        trainer: {
          select: {
            specialty: true,
            experienceYears: true,
            hourlyRate: true,
            currency: true,
            isAvailable: true,
            user: { select: { name: true, email: true, phone: true } },
            _count: { select: { clients: { where: { status: "ACTIVE" } } } },
          },
        },
      },
      orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.gymTrainer.groupBy({ by: ["status"], where: { gymId }, _count: true }),
    prisma.gymTrainer.count({ where }),
  ]);
  const counts: Record<string, number> = Object.fromEntries(grouped.map((item: any) => [item.status, item._count]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const baseQuery = `?${[status ? `status=${status}` : "", query ? `q=${encodeURIComponent(query)}` : ""].filter(Boolean).join("&")}`;

  return (
    <div className="admin-page">
      <header className="admin-page__heading admin-page__heading--compact">
        <div><span>COACHING TEAM</span><h1>Trainers</h1><p>Review applications and manage your active coaching roster.</p></div>
        <AddPersonForm endpoint={`/api/admin/gyms/${gymId}/trainers`} kind="trainer" />
      </header>

      <section className="admin-summary-strip">
        <div><span>Active</span><strong>{counts.ACTIVE || 0}</strong></div>
        <div><span>Pending</span><strong>{counts.PENDING || 0}</strong></div>
        <div><span>Suspended</span><strong>{counts.SUSPENDED || 0}</strong></div>
        <div><span>Matching filters</span><strong>{total}</strong></div>
      </section>

      <section className="admin-panel admin-table-panel">
        <div className="admin-toolbar">
          <form><Icon name="search" size={17} /><input defaultValue={query} name="q" placeholder="Search trainers by name or email" /><button type="submit">Search</button></form>
          <div className="admin-filter-links">
            {["ALL", "PENDING", "ACTIVE", "SUSPENDED"].map((item) => (
              <a className={(item === "ALL" ? !status : status === item) ? "active" : ""} href={item === "ALL" ? `?${query ? `q=${encodeURIComponent(query)}` : ""}` : `?status=${item}${query ? `&q=${encodeURIComponent(query)}` : ""}`} key={item}>{item}</a>
            ))}
          </div>
        </div>
        {access.staffRole !== "OWNER" && <p className="admin-note">Final approval of new trainers requires the gym OWNER — managers can review but approvals are audited.</p>}
        <BulkBar endpoint={`/api/admin/gyms/${gymId}/trainers/bulk`} label="عملیات گروهی مربیان" actions={[{ value: "ACTIVE", label: "تأیید گروهی" }, { value: "SUSPENDED", label: "تعلیق گروهی" }, { value: "REJECTED", label: "رد گروهی" }]} />

      {trainers.length ? <div className="admin-trainer-grid">{trainers.map((membership: any) => {
        const trainer = membership.trainer;
        return (
          <article className="admin-trainer-card" key={membership.id}>
            <div className="admin-trainer-card__top"><span className="admin-avatar admin-avatar--large">{trainer.user.name.slice(0, 2).toUpperCase()}</span><span className={`admin-status admin-status--${membership.status.toLowerCase()}`}>{membership.status}</span></div>
            <h2>{trainer.user.name}</h2><p>{trainer.specialty || "General fitness trainer"}</p>
            <div className="admin-trainer-card__meta">
              <span><Icon name="clock" size={15} /><strong>{trainer.experienceYears ?? 0} yrs</strong><small>experience</small></span>
              <span><Icon name="users" size={15} /><strong>{trainer._count.clients}</strong><small>active clients</small></span>
              <span><Icon name="credit-card" size={15} /><strong>{formatMoney(trainer.hourlyRate, trainer.currency)}</strong><small>hourly rate</small></span>
            </div>
            <div className="admin-trainer-card__contact"><span>{trainer.user.email}</span><span>{trainer.user.phone || "No phone"}</span></div>
            <div className="admin-trainer-card__foot"><input type="checkbox" data-bulk-id={membership.id} aria-label={`Select ${trainer.user.name}`} /><StatusActions endpoint={`/api/admin/gyms/${gymId}/trainers/${membership.id}`} status={membership.status} /></div>
          </article>
        );
      })}</div> : <div className="admin-panel admin-empty-table"><span><Icon name="dumbbell" size={27} /></span><h2>No trainers yet</h2><p>Add a trainer by email or wait for applications.</p></div>}
        <Pagination page={page} totalPages={totalPages} base={baseQuery || "?"} />
      </section>
    </div>
  );
}
