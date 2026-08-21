import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { requireTrainerAccess } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";

function time(date: Date) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
}

function day(date: Date) {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(date);
}

export default async function TrainerOverviewPage() {
  const { profile, user } = await requireTrainerAccess();
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [activeStudents, pendingStudents, activeGyms, upcoming, planCount, rating, completedThisMonth] = await Promise.all([
    prisma.trainerClient.count({ where: { trainerId: profile.id, status: "ACTIVE" } }),
    prisma.trainerClient.count({ where: { trainerId: profile.id, status: "PENDING" } }),
    prisma.gymTrainer.count({ where: { trainerId: profile.id, status: "ACTIVE" } }),
    prisma.trainingSession.findMany({
      where: { trainerId: profile.id, status: "SCHEDULED", startsAt: { gte: now, lte: weekEnd } },
      select: { id: true, title: true, startsAt: true, endsAt: true, gym: { select: { name: true } }, trainerClient: { select: { user: { select: { name: true } } } } },
      orderBy: { startsAt: "asc" },
      take: 6,
    }),
    prisma.workoutPlan.count({ where: { trainerId: profile.id, status: { not: "ARCHIVED" } } }),
    prisma.trainerReview.aggregate({ where: { trainerId: profile.id }, _avg: { score: true }, _count: true }),
    prisma.trainingSession.count({ where: { trainerId: profile.id, status: "COMPLETED", startsAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
  ]);

  const stats: Array<{ icon: IconName; label: string; note: string; tone: string; value: string }> = [
    { label: "Active students", value: String(activeStudents), note: `${pendingStudents} pending requests`, icon: "users", tone: "lime" },
    { label: "Sessions this week", value: String(upcoming.length), note: `${completedThisMonth} completed this month`, icon: "calendar", tone: "orange" },
    { label: "Active gyms", value: String(activeGyms), note: "Across your coaching network", icon: "building", tone: "violet" },
    { label: "Trainer rating", value: rating._count ? rating._avg.score?.toFixed(1) || "—" : "—", note: rating._count ? `${rating._count} member reviews` : "No reviews yet", icon: "sparkles", tone: "blue" },
  ];

  return (
    <div className="trainer-page">
      <header className="trainer-page__heading"><div><span>COACHING OVERVIEW</span><h1>Let&apos;s make today count, {user.name.split(" ")[0]}.</h1><p>Your students, sessions, and coaching network at a glance.</p></div><Link className="trainer-primary-button" href="/trainer/schedule"><Icon name="plus" size={16} /> Schedule session</Link></header>
      <section className="trainer-metric-grid">{stats.map((stat) => <article key={stat.label}><span className={`trainer-metric-icon trainer-tone--${stat.tone}`}><Icon name={stat.icon} size={20} /></span><small>{stat.label}</small><strong>{stat.value}</strong><p>{stat.note}</p></article>)}</section>

      <div className="trainer-dashboard-grid">
        <section className="trainer-panel trainer-agenda">
          <div className="trainer-panel__heading"><div><h2>Upcoming sessions</h2><p>Your next seven days</p></div><Link href="/trainer/schedule">Full schedule <Icon name="arrow" size={14} /></Link></div>
          {upcoming.length ? <div className="trainer-session-list">{upcoming.map((session) => <Link href="/trainer/schedule" key={session.id}><div className="trainer-session-date"><strong>{time(session.startsAt)}</strong><small>{day(session.startsAt)}</small></div><span /><div><strong>{session.title}</strong><small>{session.trainerClient.user.name} · {session.gym?.name || "Private session"}</small></div><b>{Math.round((session.endsAt.getTime() - session.startsAt.getTime()) / 60000)} min</b><Icon name="chevron" size={15} /></Link>)}</div> : <div className="trainer-empty"><Icon name="calendar" size={24} /><strong>No sessions scheduled</strong><span>Your week is clear.</span></div>}
        </section>

        <section className="trainer-panel trainer-focus-card"><div className="trainer-panel__heading"><div><h2>Coaching toolkit</h2><p>Build better client outcomes</p></div></div><div className="trainer-tool-list"><Link href="/trainer/students"><span><Icon name="users" size={18} /></span><div><strong>Student roster</strong><small>{activeStudents} active relationships</small></div><Icon name="chevron" size={14} /></Link><Link href="/trainer/profile"><span><Icon name="user" size={18} /></span><div><strong>Public profile</strong><small>{profile.specialty || "Add your specialty"}</small></div><Icon name="chevron" size={14} /></Link><Link href="/trainer/workouts"><span><Icon name="clipboard" size={18} /></span><div><strong>Workout plans</strong><small>{planCount} structured plans</small></div><Icon name="chevron" size={14} /></Link><Link href="/trainer/nutrition"><span><Icon name="heart" size={18} /></span><div><strong>Nutrition plans</strong><small>Meals, macros, and assignments</small></div><Icon name="chevron" size={14} /></Link></div></section>
      </div>
    </div>
  );
}
