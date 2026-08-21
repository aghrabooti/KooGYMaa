import { InviteStudent, StudentStatusActions } from "@/components/trainer/student-controls";
import { Icon } from "@/components/icon";
import { requireTrainerAccess } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";

function date(value: Date | null) { return value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value) : "Not started"; }

export default async function TrainerStudentsPage() {
  const access = await requireTrainerAccess();
  const [clients, gyms] = await Promise.all([
    prisma.trainerClient.findMany({ where: { trainerId: access.profile.id }, select: { id: true, status: true, requestedAt: true, startedAt: true, user: { select: { name: true, email: true, phone: true } }, gym: { select: { name: true } }, _count: { select: { workoutAssignments: true, dietAssignments: true, sessions: true } } }, orderBy: [{ status: "asc" }, { requestedAt: "desc" }] }),
    prisma.gymTrainer.findMany({ where: { trainerId: access.profile.id, status: "ACTIVE" }, select: { gym: { select: { id: true, name: true } } }, orderBy: { gym: { name: "asc" } } }),
  ]);
  const counts = { active: clients.filter((c) => c.status === "ACTIVE").length, pending: clients.filter((c) => c.status === "PENDING").length, paused: clients.filter((c) => c.status === "PAUSED").length };

  return <div className="trainer-page"><header className="trainer-page__heading trainer-page__heading--compact"><div><span>YOUR ROSTER</span><h1>Students</h1><p>Manage coaching relationships and keep every client moving forward.</p></div><InviteStudent gyms={gyms.map((item) => item.gym)} /></header><section className="trainer-summary"><div><span>Active students</span><strong>{counts.active}</strong></div><div><span>Pending requests</span><strong>{counts.pending}</strong></div><div><span>Paused</span><strong>{counts.paused}</strong></div><div><span>Total relationships</span><strong>{clients.length}</strong></div></section>{clients.length ? <div className="trainer-student-grid">{clients.map((client) => <article key={client.id}><div className="trainer-student-top"><span className="trainer-avatar">{client.user.name.slice(0, 2).toUpperCase()}</span><b className={`trainer-status trainer-status--${client.status.toLowerCase()}`}>{client.status}</b></div><h2>{client.user.name}</h2><p>{client.user.email}{client.user.phone ? ` · ${client.user.phone}` : ""}</p><div className="trainer-student-context"><Icon name="location" size={13} /> {client.gym?.name || "Independent coaching"}<span>Since {date(client.startedAt)}</span></div><div className="trainer-student-stats"><span><strong>{client._count.workoutAssignments}</strong><small>workouts</small></span><span><strong>{client._count.dietAssignments}</strong><small>diet plans</small></span><span><strong>{client._count.sessions}</strong><small>sessions</small></span></div><div className="trainer-student-footer"><a href={`/trainer/schedule?student=${client.id}`}>Schedule session <Icon name="arrow" size={13} /></a><StudentStatusActions clientId={client.id} status={client.status} /></div></article>)}</div> : <div className="trainer-panel trainer-empty"><Icon name="users" size={26} /><strong>No students yet</strong><span>Invite a member or wait for a coaching request.</span></div>}</div>;
}
