import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calcStreak, nearestExpiry, daysUntil } from "@/lib/streak";

export default async function MemberOverviewPage() {
  const user = await requireCurrentUser(["USER"]);
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const [gym, trainer, subscriptions, workout, nutrition, session, sessions, feedback, workoutLogs, nutritionLogs, measurement, notifications, pendingMembership, unfinished] = await Promise.all([
    prisma.gymMembership.findFirst({ where: { userId: user.id, status: "ACTIVE" }, select: { gym: { select: { id: true, name: true, city: true } }, expiresAt: true }, orderBy: { startedAt: "desc" } }),
    prisma.trainerClient.findFirst({ where: { userId: user.id, status: "ACTIVE" }, select: { id: true, trainer: { select: { id: true, specialty: true, user: { select: { name: true } } } } }, orderBy: { startedAt: "desc" } }),
    prisma.subscription.findMany({ where: { subscriberId: user.id, status: "ACTIVE", endDate: { gt: now } }, select: { endDate: true, plan: { select: { name: true } }, gym: { select: { name: true } } }, orderBy: { endDate: "asc" }, take: 5 }),
    prisma.workoutAssignment.findFirst({ where: { userId: user.id, status: "ACTIVE" }, select: { id: true, plan: { select: { title: true, days: { orderBy: { dayNumber: "asc" }, select: { id: true, dayNumber: true, name: true } } } } }, orderBy: { assignedAt: "desc" } }),
    prisma.dietAssignment.findFirst({ where: { userId: user.id, status: "ACTIVE" }, select: { plan: { select: { title: true, dailyCalories: true } } }, orderBy: { assignedAt: "desc" } }),
    prisma.trainingSession.findFirst({ where: { trainerClient: { userId: user.id }, status: "SCHEDULED", startsAt: { gte: now } }, select: { title: true, startsAt: true, trainer: { select: { user: { select: { name: true } } } }, gym: { select: { name: true } } }, orderBy: { startsAt: "asc" } }),
    prisma.trainingSession.findMany({ where: { trainerClient: { userId: user.id }, status: "SCHEDULED", startsAt: { gte: now } }, select: { id: true }, take: 20 }),
    prisma.feedback.findFirst({ where: { recipientId: user.id, parentId: null }, select: { content: true, createdAt: true, author: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.workoutLog.findMany({ where: { userId: user.id, startedAt: { gte: new Date(now.getTime() - 60 * 86_400_000) } }, select: { status: true, startedAt: true, completedAt: true, exerciseLogs: { select: { completed: true } } } }),
    prisma.nutritionLog.findMany({ where: { userId: user.id, logDate: { gte: weekAgo } }, select: { completedAt: true, mealLogs: { select: { completed: true } } } }),
    prisma.bodyMeasurement.findFirst({ where: { userId: user.id }, select: { weightKg: true, recordedAt: true }, orderBy: { recordedAt: "desc" } }),
    prisma.notification.findMany({ where: { userId: user.id, readAt: null }, select: { id: true, title: true, message: true, href: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.gymMembership.findFirst({ where: { userId: user.id, status: "PENDING" }, select: { gym: { select: { name: true } } } }),
    prisma.workoutLog.count({ where: { userId: user.id, status: "IN_PROGRESS" } }),
  ]);

  const exercises = workoutLogs.flatMap((log: any) => log.exerciseLogs);
  const meals = nutritionLogs.flatMap((log: any) => log.mealLogs);
  const workoutRate = exercises.length ? Math.round(exercises.filter((item: any) => item.completed).length / exercises.length * 100) : 0;
  const nutritionRate = meals.length ? Math.round(meals.filter((item: any) => item.completed).length / meals.length * 100) : 0;
  // Item 2: correct consecutive-day streak on Tehran day boundaries.
  const activeDates = workoutLogs.filter((l: any) => l.status === "COMPLETED").map((l: any) => l.completedAt || l.startedAt);
  const streak = calcStreak(activeDates, now);
  // Item 2: nearest expiry across subscriptions.
  type Sub = { endDate: Date; plan: { name: string }; gym: { name: string } };
  const nearest = nearestExpiry(subscriptions as Sub[], now);

  // Item 7: today's workout — rotate plan days by Tehran weekday.
  const tehranWeekday = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", weekday: "short" }).format(now) ? 0 : 0);
  void tehranWeekday;
  const dowFa = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tehran", weekday: "short" }).format(now);
  const dowIndex = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(dowFa);
  const todayDay = workout && workout.plan.days.length ? workout.plan.days[Math.max(0, dowIndex) % workout.plan.days.length] : null;

  const metrics: Array<{ icon: IconName; label: string; value: string; note: string; tone: string }> = [
    { icon: "dumbbell", label: "Workout consistency", value: `${workoutRate}%`, note: `${workoutLogs.filter((log: any) => log.status === "COMPLETED").length} workouts (60d)`, tone: "lime" },
    { icon: "heart", label: "Nutrition consistency", value: `${nutritionRate}%`, note: `${nutritionLogs.filter((log: any) => log.completedAt).length} complete days`, tone: "orange" },
    { icon: "flame", label: "Active streak", value: `${streak} days`, note: streak > 0 ? "Keep showing up" : "Complete a workout to start", tone: "violet" },
    { icon: "trend", label: "Latest weight", value: measurement?.weightKg ? `${measurement.weightKg} kg` : "—", note: measurement ? `Recorded ${measurement.recordedAt.toLocaleDateString()}` : "Add a check-in", tone: "blue" },
  ];

  // Item 7: onboarding guide + required actions.
  const steps = [
    { done: Boolean(gym), label: "Join a gym", href: "/user/gyms" },
    { done: Boolean(subscriptions.length), label: "Activate a subscription", href: "/user/subscriptions" },
    { done: Boolean(trainer), label: "Connect with a trainer", href: "/user/trainers" },
    { done: Boolean(workout), label: "Get your workout plan", href: "/user/workouts" },
    { done: Boolean(measurement), label: "Record your first check-in", href: "/user/progress" },
  ];
  const doneSteps = steps.filter((s) => s.done).length;
  const actions: Array<{ label: string; href: string }> = [];
  if (pendingMembership) actions.push({ label: `Membership to ${pendingMembership.gym.name} is pending review`, href: "/user/gyms" });
  if (unfinished > 0) actions.push({ label: `${unfinished} unfinished workout — continue where you left off`, href: "/user/workouts" });
  if (nearest) {
    const d = daysUntil(nearest.endDate, now);
    if (d <= 7) actions.push({ label: `«${nearest.plan.name}» expires in ${d} day${d === 1 ? "" : "s"} — renew in time`, href: "/user/subscriptions" });
  }
  if (session) actions.push({ label: `Next session: ${session.title} at ${session.startsAt.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}`, href: "/user/schedule" });
  if (!workout) actions.push({ label: "No workout assigned yet — ask your trainer", href: "/user/trainers" });

  return (
    <div className="member-page">
      <header className="member-page__heading"><div><span>YOUR DAY</span><h1>Welcome back, {user.name.split(" ")[0]}.</h1><p>Your training, nutrition, coaching, and memberships at a glance.</p></div><Link className="member-primary-button" href="/user/workouts">Start training <Icon name="arrow" size={15} /></Link></header>

      {doneSteps < steps.length && (
        <section className="member-panel member-onboarding" aria-label="راهنمای شروع">
          <div className="member-panel__heading"><div><h2>Getting started ({doneSteps}/{steps.length})</h2><p>Five quick steps to unlock everything</p></div></div>
          <ol>{steps.map((s) => <li key={s.label} className={s.done ? "done" : ""}><span>{s.done ? "✓" : "○"}</span>{s.done ? s.label : <Link href={s.href}>{s.label}</Link>}</li>)}</ol>
        </section>
      )}

      {(todayDay || session || actions.length > 0) && (
        <section className="member-today-strip">
          {todayDay && <Link className="member-today-card" href="/user/workouts"><span><Icon name="dumbbell" size={19} /></span><div><small>تمرین امروز</small><strong>{todayDay.name}</strong></div><Icon name="chevron" size={14} /></Link>}
          {session && <Link className="member-today-card" href="/user/schedule"><span><Icon name="calendar" size={19} /></span><div><small>جلسه بعدی · {sessions.length} scheduled</small><strong>{session.title}</strong></div><Icon name="chevron" size={14} /></Link>}
          {actions.length > 0 && <div className="member-actions-card"><small>اقدامات ضروری</small><ul>{actions.slice(0, 4).map((a) => <li key={a.label}><Link href={a.href}>{a.label}</Link></li>)}</ul></div>}
        </section>
      )}

      <section className="member-dashboard-metrics">{metrics.map((metric) => <article key={metric.label}><span className={`member-dashboard-icon member-dashboard-icon--${metric.tone}`}><Icon name={metric.icon} size={19} /></span><small>{metric.label}</small><strong>{metric.value}</strong><p>{metric.note}</p></article>)}</section>
      <div className="member-dashboard-grid"><section className="member-panel member-today"><div className="member-panel__heading"><div><h2>Your active services</h2><p>Everything currently available to you</p></div></div><div><Link href="/user/workouts"><span><Icon name="dumbbell" size={19} /></span><div><strong>{workout?.plan.title || "No workout assigned"}</strong><small>{workout ? `${workout.plan.days.length} training days` : "Connect with a trainer"}</small></div><Icon name="chevron" size={14} /></Link><Link href="/user/nutrition"><span><Icon name="heart" size={19} /></span><div><strong>{nutrition?.plan.title || "No nutrition plan"}</strong><small>{nutrition?.plan.dailyCalories ? `${nutrition.plan.dailyCalories} kcal target` : "Flexible nutrition guidance"}</small></div><Icon name="chevron" size={14} /></Link><Link href="/user/gyms"><span><Icon name="building" size={19} /></span><div><strong>{gym?.gym.name || "Discover a gym"}</strong><small>{gym ? gym.gym.city || "Active membership" : "Browse local gyms"}</small></div><Icon name="chevron" size={14} /></Link><Link href="/user/trainers"><span><Icon name="users" size={19} /></span><div><strong>{trainer?.trainer.user.name || "Find a trainer"}</strong><small>{trainer?.trainer.specialty || "Personal coaching"}</small></div><Icon name="chevron" size={14} /></Link></div></section><section className="member-panel member-next-session"><div className="member-panel__heading"><div><h2>Next session</h2><p>Your upcoming coaching appointment</p></div></div>{session ? <div><span><Icon name="calendar" size={22} /></span><small>{session.startsAt.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" }).toUpperCase()}</small><strong>{session.startsAt.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}</strong><h3>{session.title}</h3><p>{session.trainer.user.name} · {session.gym?.name || "Private / online"}</p><Link href="/user/schedule">View schedule <Icon name="arrow" size={14} /></Link></div> : <div className="member-empty"><Icon name="calendar" size={24} /><h2>No upcoming session</h2><p>Your schedule is clear.</p></div>}</section></div>
      <div className="member-dashboard-bottom"><section className="member-panel"><div className="member-panel__heading"><div><h2>Latest coach feedback</h2><p>Guidance from your trainer</p></div><Link href="/user/progress">View all</Link></div>{feedback ? <blockquote><Icon name="sparkles" size={18} /><p>{feedback.content}</p><footer>{feedback.author.name} · {feedback.createdAt.toLocaleDateString()}</footer></blockquote> : <p className="member-empty-line">No feedback yet.</p>}</section><section className="member-panel"><div className="member-panel__heading"><div><h2>Membership</h2><p>Current subscription access</p></div><Link href="/user/subscriptions">Details</Link></div>{nearest ? <div className="member-subscription-mini"><span><Icon name="credit-card" size={19} /></span><div><strong>{nearest.plan.name}</strong><small>{nearest.gym.name}</small></div><b>{daysUntil(nearest.endDate, now)} days left</b></div> : <p className="member-empty-line">No active subscription.</p>}</section></div>
      {notifications.length > 0 && <section className="member-panel member-dashboard-notifications"><div className="member-panel__heading"><div><h2>Unread updates</h2><p>{notifications.length} recent notifications</p></div><Link href="/user/notifications">Open inbox</Link></div><div>{notifications.map((item: any) => <Link href={item.href || "/user/notifications"} key={item.id}><span><Icon name="bell" size={15} /></span><div><strong>{item.title}</strong><small>{item.message}</small></div><Icon name="chevron" size={14} /></Link>)}</div></section>}
    </div>
  );
}
