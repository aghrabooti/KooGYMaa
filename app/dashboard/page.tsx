import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/icon";
import { LogoutButton } from "@/components/logout-button";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

type DashboardRole = "ADMIN" | "TRAINER" | "USER";

type Stat = {
  label: string;
  value: string;
  change: string;
  icon: IconName;
  tone: string;
};

const dashboardData: Record<DashboardRole, {
  title: string;
  subtitle: string;
  action: string;
  stats: Stat[];
}> = {
  ADMIN: {
    title: "Ready for a strong day?",
    subtitle: "Here’s what’s happening across your gym right now.",
    action: "Add member",
    stats: [
      { label: "Active members", value: "1,248", change: "+8.4% this month", icon: "users", tone: "lime" },
      { label: "Monthly revenue", value: "$48.2k", change: "+12.1% this month", icon: "trend", tone: "orange" },
      { label: "Today’s check-ins", value: "186", change: "72% of daily avg.", icon: "check", tone: "violet" },
      { label: "Active trainers", value: "24", change: "4 coaching now", icon: "dumbbell", tone: "blue" },
    ],
  },
  TRAINER: {
    title: "Let’s make today count.",
    subtitle: "Your clients, sessions, and coaching plan are all on track.",
    action: "Build a plan",
    stats: [
      { label: "Active clients", value: "28", change: "+3 this month", icon: "users", tone: "lime" },
      { label: "Today’s sessions", value: "8", change: "Next at 10:30", icon: "calendar", tone: "orange" },
      { label: "Plans delivered", value: "42", change: "6 updated this week", icon: "clipboard", tone: "violet" },
      { label: "Average rating", value: "4.9", change: "From 96 reviews", icon: "sparkles", tone: "blue" },
    ],
  },
  USER: {
    title: "Your next win starts here.",
    subtitle: "Keep the streak alive and stay focused on your weekly plan.",
    action: "Start workout",
    stats: [
      { label: "Workouts this week", value: "4/5", change: "One more to goal", icon: "dumbbell", tone: "lime" },
      { label: "Current streak", value: "12 days", change: "Personal best", icon: "flame", tone: "orange" },
      { label: "Plan progress", value: "76%", change: "+9% this week", icon: "trend", tone: "violet" },
      { label: "Next session", value: "10:30", change: "Upper body", icon: "clock", tone: "blue" },
    ],
  },
};

const navItems: Array<{ label: string; icon: IconName; href: string }> = [
  { label: "Overview", icon: "grid", href: "#overview" },
  { label: "Schedule", icon: "calendar", href: "#schedule" },
  { label: "People", icon: "users", href: "#people" },
  { label: "Plans", icon: "clipboard", href: "#plans" },
  { label: "Insights", icon: "bar-chart", href: "#insights" },
];

const schedule = [
  { time: "10:30", period: "AM", title: "Strength Fundamentals", meta: "Studio A · 9 members", tone: "lime", initials: ["JR", "MO", "+7"] },
  { time: "12:00", period: "PM", title: "Mobility & Recovery", meta: "Studio B · 6 members", tone: "orange", initials: ["KA", "NS", "+4"] },
  { time: "02:30", period: "PM", title: "1:1 Coaching · Alex M.", meta: "Training floor · 60 min", tone: "violet", initials: ["AM"] },
];

function roleLabel(role: DashboardRole) {
  if (role === "ADMIN") return "Gym admin";
  if (role === "TRAINER") return "Trainer";
  return "Member";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  if (user.role === "ADMIN") {
    const workspace = await prisma.gymStaff.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      select: { gymId: true },
      orderBy: { joinedAt: "asc" },
    });
    redirect(workspace ? `/admin/gyms/${workspace.gymId}` : "/admin/gyms");
  }

  if (user.role === "TRAINER") {
    redirect("/trainer");
  }

  if (user.role === "USER") {
    redirect("/user");
  }

  const role = user.role as DashboardRole;
  const data = dashboardData[role];

  return (
    <main className="dashboard-shell" id="overview">
      <aside className="dashboard-sidebar">
        <Brand light />
        <div className="dashboard-workspace">
          <span>WORKSPACE</span>
          <button type="button">
            <span className="workspace-mark">KG</span>
            <span><strong>KooGYMaa HQ</strong><small>Tokyo, Japan</small></span>
            <Icon name="chevron" size={15} />
          </button>
        </div>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <small>MAIN MENU</small>
          {navItems.map((item, index) => (
            <a className={`dashboard-nav__item ${index === 0 ? "active" : ""}`} href={item.href} key={item.label}>
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.label === "Schedule" && <b>8</b>}
            </a>
          ))}
        </nav>
        <div className="dashboard-nav dashboard-nav--bottom">
          <a className="dashboard-nav__item" href="#settings"><Icon name="settings" size={19} /><span>Settings</span></a>
          <LogoutButton />
        </div>
        <div className="sidebar-help">
          <span><Icon name="sparkles" size={17} /></span>
          <strong>Need a hand?</strong>
          <p>Our support team is ready.</p>
          <a href="mailto:support@koogymaa.com">Get support <Icon name="arrow" size={14} /></a>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-mobile-brand"><Brand compact /></div>
          <label className="dashboard-search">
            <Icon name="search" size={19} />
            <input aria-label="Search dashboard" placeholder="Search members, plans, sessions…" type="search" />
            <kbd>⌘ K</kbd>
          </label>
          <div className="dashboard-user">
            <button aria-label="Notifications" className="icon-button" type="button"><Icon name="bell" size={20} /><span /></button>
            <div className="dashboard-user__avatar">{getInitials(user.name)}</div>
            <div><strong>{user.name}</strong><small>{roleLabel(role)}</small></div>
            <Icon name="chevron" size={15} />
          </div>
        </header>

        <div className="dashboard-content">
          <div className="dashboard-welcome">
            <div>
              <span className="dashboard-date">FRIDAY · AUGUST 21</span>
              <h1>{data.title}</h1>
              <p>{data.subtitle}</p>
            </div>
            <button className="dashboard-primary-action" type="button"><Icon name="plus" size={18} /> {data.action}</button>
          </div>

          <section className="dashboard-stat-grid" aria-label="At a glance">
            {data.stats.map((stat) => (
              <article className="dashboard-stat" key={stat.label}>
                <div className={`dashboard-stat__icon dashboard-stat__icon--${stat.tone}`}><Icon name={stat.icon} size={21} /></div>
                <div className="dashboard-stat__value"><strong>{stat.value}</strong><Icon name="trend" size={17} /></div>
                <p>{stat.label}</p>
                <small>{stat.change}</small>
              </article>
            ))}
          </section>

          <div className="dashboard-layout-grid">
            <section className="dashboard-panel activity-panel" id="insights">
              <div className="dashboard-panel__header">
                <div><h2>Weekly activity</h2><p>Member visits across all sessions</p></div>
                <button type="button">Last 7 days <span>⌄</span></button>
              </div>
              <div className="activity-summary"><strong>2,846</strong><span><Icon name="trend" size={15} /> 14.2%</span><small>vs. previous week</small></div>
              <div className="activity-chart-wrap">
                <div className="chart-y-axis"><span>800</span><span>600</span><span>400</span><span>200</span><span>0</span></div>
                <svg className="activity-chart" viewBox="0 0 680 230" preserveAspectRatio="none" role="img" aria-label="Weekly member activity chart">
                  <defs>
                    <linearGradient id="dashboardArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#bde65f" stopOpacity=".35" /><stop offset="1" stopColor="#bde65f" stopOpacity="0" /></linearGradient>
                  </defs>
                  <path className="activity-chart__grid" d="M0 10h680M0 62h680M0 114h680M0 166h680M0 218h680" />
                  <path className="activity-chart__area" d="M0 188C42 179 59 142 103 153s62-18 101-7 59 17 96-21 62-8 97-31 62-63 101-40 60 48 96 13 57-20 86-48V230H0Z" />
                  <path className="activity-chart__line" d="M0 188C42 179 59 142 103 153s62-18 101-7 59 17 96-21 62-8 97-31 62-63 101-40 60 48 96 13 57-20 86-48" />
                  <circle cx="498" cy="54" r="6" />
                  <line x1="498" x2="498" y1="54" y2="218" />
                </svg>
                <div className="chart-tooltip"><small>SATURDAY</small><strong>684 visits</strong></div>
                <div className="activity-days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
              </div>
            </section>

            <section className="dashboard-panel progress-panel" id="plans">
              <div className="dashboard-panel__header"><div><h2>Monthly goal</h2><p>August progress</p></div><button aria-label="More options" className="more-button" type="button">•••</button></div>
              <div className="progress-ring" style={{ "--progress": "76%" } as CSSProperties}>
                <div><strong>76%</strong><span>on track</span></div>
              </div>
              <div className="progress-copy">
                <strong>Great momentum!</strong>
                <p>You&apos;re 1,140 visits away from this month&apos;s target.</p>
              </div>
              <div className="progress-legend"><span><i /> 3,860 completed</span><span><i /> 5,000 goal</span></div>
            </section>
          </div>

          <section className="dashboard-panel schedule-panel" id="schedule">
            <div className="dashboard-panel__header">
              <div><h2>Today&apos;s schedule</h2><p>8 sessions · Friday, August 21</p></div>
              <a href="#schedule">View full schedule <Icon name="arrow" size={16} /></a>
            </div>
            <div className="schedule-list">
              {schedule.map((session) => (
                <article className="schedule-item" key={session.time}>
                  <div className="schedule-time"><strong>{session.time}</strong><span>{session.period}</span></div>
                  <div className={`schedule-line schedule-line--${session.tone}`} />
                  <div className={`schedule-icon schedule-icon--${session.tone}`}><Icon name={session.title.startsWith("1:1") ? "user" : "dumbbell"} size={20} /></div>
                  <div className="schedule-info"><strong>{session.title}</strong><span><Icon name="location" size={13} /> {session.meta}</span></div>
                  <div className="schedule-people">{session.initials.map((initial) => <span key={initial}>{initial}</span>)}</div>
                  <button aria-label={`Open ${session.title}`} type="button"><Icon name="chevron" size={17} /></button>
                </article>
              ))}
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>© 2026 KooGYMaa</span>
            <div><Link href="/">Home</Link><a href="#settings">Help center</a><a href="#settings">Privacy</a></div>
          </footer>
        </div>
      </section>
    </main>
  );
}
