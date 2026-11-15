import Link from "next/link";
import { CreateAccountForm } from "@/components/account/create-account-form";
import { InviteStudent, StudentStatusActions, NudgeButton } from "@/components/trainer/student-controls";
import { Icon } from "@/components/icon";
import { requireTrainerAccess } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";
import { lowActiveStudents, unansweredThreads } from "@/lib/engagement";
import { faStatus } from "@/components/fa";

function date(value: Date | null) { return value ? new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric", year: "numeric" }).format(value) : "شروع نشده"; }

export default async function TrainerStudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim() ?? "";
  const access = await requireTrainerAccess();
  const [clients, gyms, recentLogs, threads] = await Promise.all([
    prisma.trainerClient.findMany({ where: { trainerId: access.profile.id }, select: { id: true, status: true, requestedAt: true, startedAt: true, userId: true, user: { select: { name: true, email: true, phone: true, username: true } }, gym: { select: { name: true } }, _count: { select: { workoutAssignments: true, dietAssignments: true, sessions: true } } }, orderBy: [{ status: "asc" }, { requestedAt: "desc" }] }),
    prisma.gymTrainer.findMany({ where: { trainerId: access.profile.id, status: "ACTIVE" }, select: { gym: { select: { id: true, name: true } } }, orderBy: { gym: { name: "asc" } } }),
    prisma.workoutLog.findMany({ where: { assignment: { trainerClient: { trainerId: access.profile.id } }, status: "COMPLETED" }, select: { userId: true, completedAt: true, startedAt: true }, orderBy: { completedAt: "desc" }, take: 500 }),
    prisma.feedback.findMany({ where: { recipientId: access.user.id, parentId: null }, select: { id: true, authorId: true, recipientId: true, createdAt: true, content: true, author: { select: { name: true } }, replies: { select: { authorId: true, createdAt: true }, orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const visibleClients = query ? clients.filter(({ user }) =>
    [user.name, user.username, user.email].some((value) => value?.toLowerCase().includes(query.toLowerCase())),
  ) : clients;
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

  return <div className="trainer-page"><header className="trainer-page__heading trainer-page__heading--compact"><div><span>شاگردان شما</span><h1>شاگردان</h1><p>رابطه‌های مربی‌گری را مدیریت کنید و هر مراجع را رو به جلو نگه دارید.</p></div><div className="trainer-heading-actions"><Link className="trainer-secondary-button" href="/trainer/messages"><Icon name="mail" size={15} /> پیام‌ها</Link><CreateAccountForm endpoint="/api/trainer/clients/accounts" kind="شاگرد" panel="trainer" gyms={gyms.map((item) => item.gym)} /><InviteStudent gyms={gyms.map((item) => item.gym)} /></div></header><section className="trainer-summary"><div><span>شاگردان فعال</span><strong>{counts.active}</strong></div><div><span>درخواست‌های در انتظار</span><strong>{counts.pending}</strong></div><div><span>کم‌فعال (بیش از ۷ روز)</span><strong>{lowActive.size}</strong></div><div><span>در انتظار پاسخ</span><strong>{unanswered.length}</strong></div></section>
  {unanswered.length > 0 && <section className="trainer-panel trainer-attention"><div className="trainer-panel__heading"><div><h2>پیام‌های بی‌پاسخ</h2><p>بیش از ۲۴ ساعت بدون پاسخ شما</p></div></div><div>{(threads as any[]).filter((t) => unansweredIds.has(t.id)).map((t) => <article key={t.id}><strong>{t.author.name}</strong><p>{t.content.slice(0, 140)}</p><Link href="/trainer/messages">مشاهده و پاسخ</Link></article>)}</div></section>}
  <form className="trainer-inline-form"><label><span>جست‌وجوی افراد</span><input name="q" defaultValue={query} placeholder="نام، نام کاربری یا ایمیل" /></label><button className="trainer-secondary-button" type="submit">جست‌وجو</button>{query && <Link className="trainer-secondary-button" href="/trainer/students">همهٔ افراد</Link>}</form>
  {visibleClients.length ? <div className="trainer-student-grid">{visibleClients.map((client) => <article key={client.id} className={lowActive.has(client.userId) ? "is-low-active" : ""}><div className="trainer-student-top"><span className="trainer-avatar">{client.user.name.slice(0, 2).toUpperCase()}</span><b className={`trainer-status trainer-status--${client.status.toLowerCase()}`}>{faStatus(client.status)}</b></div><h2>{client.user.name}</h2><p><bdi>{[client.user.username, client.user.email].filter(Boolean).join(" · ")}</bdi>{client.user.phone ? ` · ${client.user.phone}` : ""}</p>{lowActive.has(client.userId) && <p className="trainer-low-active">⚠ کم‌فعال — آخرین تمرین: {lastByUser.get(client.userId)?.toLocaleDateString("fa-IR") || "ثبت نشده"}</p>}<div className="trainer-student-context"><Icon name="location" size={13} /> {client.gym?.name || "مربی‌گری مستقل"}<span>از {date(client.startedAt)}</span></div><div className="trainer-student-stats"><span><strong>{client._count.workoutAssignments}</strong><small>تمرین‌ها</small></span><span><strong>{client._count.dietAssignments}</strong><small>برنامه‌های غذایی</small></span><span><strong>{client._count.sessions}</strong><small>جلسات</small></span></div><div className="trainer-student-footer"><Link href={`/trainer/progress/${client.id}`}>پروندهٔ تمرین</Link><Link className="trainer-student-message" href={`/trainer/messages?student=${client.id}`}><Icon name="mail" size={14} /> پیام</Link><Link href={`/trainer/schedule?student=${client.id}`}>زمان‌بندی جلسه <Icon name="arrow" size={13} /></Link><StudentStatusActions clientId={client.id} status={client.status} />{client.status === "ACTIVE" && lowActive.has(client.userId) && <NudgeButton clientId={client.id} />}</div></article>)}</div> : <div className="trainer-panel trainer-empty"><Icon name="users" size={26} /><strong>{query ? "کسی با این مشخصات پیدا نشد" : "هنوز کسی به فهرست شما اضافه نشده است"}</strong></div>}</div>;
}
