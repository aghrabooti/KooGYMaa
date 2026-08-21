import { AddPersonForm } from "@/components/admin/add-person-form";
import { StatusActions } from "@/components/admin/status-actions";
import { Icon } from "@/components/icon";
import { requireGymAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ gymId: string }> };

function formatMoney(value: number | null, currency: string) {
  if (value === null) return "Rate not set";
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}

export default async function TrainersPage({ params }: PageProps) {
  const { gymId } = await params;
  await requireGymAdminAccess(gymId);

  const [trainers, grouped] = await Promise.all([
    prisma.gymTrainer.findMany({
      where: { gymId },
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
    }),
    prisma.gymTrainer.groupBy({ by: ["status"], where: { gymId }, _count: true }),
  ]);
  const counts = Object.fromEntries(grouped.map((item) => [item.status, item._count]));

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
        <div><span>Total records</span><strong>{grouped.reduce((sum, item) => sum + item._count, 0)}</strong></div>
      </section>

      {trainers.length ? <div className="admin-trainer-grid">{trainers.map((membership) => {
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
            <StatusActions endpoint={`/api/admin/gyms/${gymId}/trainers/${membership.id}`} status={membership.status} />
          </article>
        );
      })}</div> : <div className="admin-panel admin-empty-table"><span><Icon name="dumbbell" size={27} /></span><h2>No trainers yet</h2><p>Add a trainer by email or wait for applications.</p></div>}
    </div>
  );
}
