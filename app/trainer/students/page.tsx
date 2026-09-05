import Link from "next/link";
import { InviteStudent, StudentStatusActions, NudgeButton } from "@/components/trainer/student-controls";
import { Icon } from "@/components/icon";
import { requireTrainerAccess } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";
import { lowActiveStudents, unansweredThreads } from "@/lib/engagement";

function date(value: Date | null) { return value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value) : "Not started"; }

export default async function TrainerStudentsPage() {
  const access = await requireTrainerAccess();
  const [clients, gyms, recentLogs, threads] = await Promise.all([
    prisma.trainerClient.findMany({ where: { trainerId: access.profile.id }, select: { id: true, status: true, requestedAt: true, startedAt: true, userId: true, user: { select: { name: true, email: true, phone: true } }, gym: { select: { name: true } }, _count: { select: { workoutAssignments: true, dietAssignments: true, sessions: true } } }, orderBy: [{ status: "asc" }, { requestedAt: "desc" }] }),
    prisma.gymTrainer.findMany({ where: { trainerId: access.profile.id, status: "ACTIVE" }, select: { gym: { select: { id: true, name: true } } }, orderBy: { gym: { name: "asc" } } }),
    prisma.workoutLog.findMany({ where: { assignment: { trainerClient: { trainerId: access.profile.id } }, status: "COMPLETED" }, select: { userId: true, completedAt: true, startedAt: true }, orderBy: { completedAt: "desc" }, take: 500 }),
    prisma.feedback.findMany({ where: { recipientId: access.user.id, parentId: null }, select: { id: true, authorId: true, recipientId: true, createdAt: true, content: true, author: { select: { name: true } }, replies: { select: { authorId: true, createdAt: true }, orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const counts = { active: clients.filter((c: any) => c.status === "ACTIVE").length, pending: clients.filter((c: any) => c.status === "PENDING").length, paused: clients.filter((c: any) => c.status === "PAUSED").length };

  // Item 12: low-active students (last completed workout per user).
  const lastByUser = new Map<string, Date>();
  for (const log of recentLogs as any[]) {
    if (!lastByUser.has(log.userId)) lastByUser.set(log.userId, log.completedAt || log.startedAt);
  }
  const lowActive = new Set(lowActiveStudents(
    (clients as any[]).filter((c) => c.status === "ACTIVE").map((c) => ({ userId: c.userId, lastActiveAt: lastByUser.get(c.userId) || null })),
    7,
  ));
  // Item 12: threads awaiting the trainer's reply.
  const unanswered = unansweredThreads(
    (threads as any[]).map((t) => ({ id: t.id, authorId: t.authorId, recipientId: t.recipientId, createdAt: t.createdAt, replies: t.replies })),
    access.user.id,
    24,
  );
  const unansweredIds = new Set(unanswered.map((t) => t.id));

  return <div className="trainer-page"><header className="trainer-page__heading trainer-page__heading--compact"><div><span>YOUR ROSTER</span><h1>Students</h1><p>Manage coaching relationships and keep every client moving forward.</p></div><InviteStudent gyms={gyms.map((item: any) => item.gym)} /></header><section className="trainer-summary"><div><span>Active students</span><strong>{counts.active}</strong></div><div><span>Pending requests</span><strong>{counts.pending}</strong></div><div><span>Low-active (7d+)</span><strong>{lowActive.size}</strong></div><div><span>Awaiting reply</span><strong>{unanswered.length}</strong></div></section>
  {unanswered.length > 0 && <section className="trainer-panel trainer-attention"><div className="trainer-panel__heading"><div><h2>پیام‌های بی‌پاسخ</h2><p>بیش از ۲۴ ساعت بدون پاسخ شما</p></div></div><div>{(threads as any[]).filter((t) => unansweredIds.has(t.id)).map((t) => <article key={t.id}><strong>{t.author.name}</strong><p>{t.content.slice(0, 140)}</p><Link href="/trainer/progress">مشاهده و پاسخ</Link></article>)}</div></section>}
  {clients.length ? <div className="trainer-student-grid">{clients.map((client: any) => <article key={client.id} className={lowActive.has(client.userId) ? "is-low-active" : ""}><div className="trainer-student-top"><span className="trainer-avatar">{client.user.name.slice(0, 2).toUpperCase()}</span><b className={`trainer-status trainer-status--${client.status.toLowerCase()}`}>{client.status}</b></div><h2>{client.user.name}</h2><p>{client.user.email}{client.user.phone ? ` · ${client.user.phone}` : ""}</p>{lowActive.has(client.userId) && <p className="trainer-low-active">⚠ کم‌فعال — آخرین تمرین: {lastByUser.get(client.userId)?.toLocaleDateString("fa-IR") || "ثبت نشده"}</p>}<div className="trainer-student-context"><Icon name="location" size={13} /> {client.gym?.name || "Independent coaching"}<span>Since {date(client.startedAt)}</span></div><div className="trainer-student-stats"><span><strong>{client._count.workoutAssignments}</strong><small>workouts</small></span><span><strong>{client._count.dietAssignments}</strong><small>diet plans</small></span><span><strong>{client._count.sessions}</strong><small>sessions</small></span></div><div className="trainer-student-footer"><Link href={`/trainer/schedule?student=${client.id}`}>Schedule session <Icon name="arrow" size={13} /></Link><StudentStatusActions clientId={client.id} status={client.status} />{client.status === "ACTIVE" && lowActive.has(client.userId) && <NudgeButton clientId={client.id} />}</div></article>)}</div> : <div className="trainer-panel trainer-empty"><Icon name="users" size={26} /><strong>No students yet</strong><span>Invite a member or wait for a coaching request.</span></div>}</div>;
}
