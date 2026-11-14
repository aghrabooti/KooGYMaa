import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/icon";
import { LogoutButton } from "@/components/logout-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

type DashboardRole = "ADMIN" | "TRAINER" | "USER";

type Stat = {
  labelKey: string;
  value: string;
  change: string;
  icon: IconName;
  tone: string;
};

const dashboardData: Record<DashboardRole, {
  titleKey: string;
  subtitleKey: string;
  actionKey: string;
  stats: Stat[];
}> = {
  ADMIN: {
    titleKey: "dash.adminTitle",
    subtitleKey: "dash.adminSubtitle",
    actionKey: "dash.actionAddMember",
    stats: [
      { labelKey: "dash.statActiveMembers", value: "1,248", change: "۸٫۴٪+ نسبت به ماه قبل", icon: "users", tone: "lime" },
      { labelKey: "dash.statMonthlyRevenue", value: "۴۸٫۲ میلیون تومان", change: "۱۲٫۱٪+ نسبت به ماه قبل", icon: "trend", tone: "orange" },
      { labelKey: "dash.statTodaysCheckins", value: "186", change: "۷۲٪ میانگین روزانه", icon: "check", tone: "violet" },
      { labelKey: "dash.statActiveTrainers", value: "24", change: "۴ مربی هم اکنون فعالاند", icon: "dumbbell", tone: "blue" },
    ],
  },
  TRAINER: {
    titleKey: "dash.trainerTitle",
    subtitleKey: "dash.trainerSubtitle",
    actionKey: "dash.actionBuildPlan",
    stats: [
      { labelKey: "dash.statActiveClients", value: "28", change: "۳+ شاگرد تازه", icon: "users", tone: "lime" },
      { labelKey: "dash.statTodaysSessions", value: "8", change: "جلسه بعدی ساعت ۱۰:۳۰", icon: "calendar", tone: "orange" },
      { labelKey: "dash.statPlansDelivered", value: "42", change: "۶ برنامه بهروزرسانی شد", icon: "clipboard", tone: "violet" },
      { labelKey: "dash.statAverageRating", value: "4.9", change: "از ۹۶ نظر", icon: "sparkles", tone: "blue" },
    ],
  },
  USER: {
    titleKey: "dash.userTitle",
    subtitleKey: "dash.userSubtitle",
    actionKey: "dash.actionStartWorkout",
    stats: [
      { labelKey: "dash.statWorkoutsThisWeek", value: "4/5", change: "یک تمرین تا هدف", icon: "dumbbell", tone: "lime" },
      { labelKey: "dash.statCurrentStreak", value: "۱۲ روز", change: "بهترین رکورد شما", icon: "flame", tone: "orange" },
      { labelKey: "dash.statPlanProgress", value: "76%", change: "۹٪+ این هفته", icon: "trend", tone: "violet" },
      { labelKey: "dash.statNextSession", value: "10:30", change: "تمرین بالاتنه", icon: "clock", tone: "blue" },
    ],
  },
};

const navItems: Array<{ labelKey: string; icon: IconName; href: string }> = [
  { labelKey: "nav.overview", icon: "grid", href: "#overview" },
  { labelKey: "nav.schedule", icon: "calendar", href: "#schedule" },
  { labelKey: "nav.people", icon: "users", href: "#people" },
  { labelKey: "nav.plans", icon: "clipboard", href: "#plans" },
  { labelKey: "nav.insights", icon: "bar-chart", href: "#insights" },
];

const schedule = [
  { time: "۱۰:۳۰", period: "صبح", title: "اصول قدرت", meta: "استودیو A · ۹ عضو", tone: "lime", initials: ["JR", "MO", "+7"] },
  { time: "۱۲:۰۰", period: "ظهر", title: "تحرک و ریکاوری", meta: "استودیو B · ۶ عضو", tone: "orange", initials: ["KA", "NS", "+4"] },
  { time: "۱۴:۳۰", period: "عصر", title: "مربیگری خصوصی · آرش م.", meta: "سالن تمرین · ۶۰ دقیقه", tone: "violet", initials: ["AM"] },
];

function roleLabelKey(role: DashboardRole) {
  if (role === "ADMIN") return "nav.gymAdministrator";
  if (role === "TRAINER") return "auth.trainer";
  return "auth.member";
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
  const t = createT(await getLocale());

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
          <span>فضای کاری</span>
          <button type="button">
            <span className="workspace-mark">KG</span>
            <span><strong>دفتر مرکزی کوجیما</strong><small>تهران، ایران</small></span>
            <Icon name="chevron" size={15} />
          </button>
        </div>
        <nav className="dashboard-nav" aria-label="ناوبری پیشخوان">
          <small>{t("nav.mainMenu")}</small>
          {navItems.map((item, index) => (
            <a className={`dashboard-nav__item ${index === 0 ? "active" : ""}`} href={item.href} key={item.labelKey}>
              <Icon name={item.icon} size={19} />
              <span>{t(item.labelKey)}</span>
              {item.labelKey === "nav.schedule" && <b>8</b>}
            </a>
          ))}
        </nav>
        <div className="dashboard-nav dashboard-nav--bottom">
          <a className="dashboard-nav__item" href="#settings"><Icon name="settings" size={19} /><span>{t("nav.settings")}</span></a>
          <LogoutButton />
        </div>
        <div className="sidebar-help">
          <span><Icon name="sparkles" size={17} /></span>
          <strong>{t("dash.needAHand")}</strong>
          <p>{t("dash.supportReady")}</p>
          <a href="mailto:support@koogymaa.com">{t("dash.getSupport")} <Icon name="arrow" size={14} /></a>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-mobile-brand"><Brand compact /></div>
          <label className="dashboard-search">
            <Icon name="search" size={19} />
            <input aria-label={t("common.search")} placeholder={t("dash.searchPlaceholder")} type="search" />
            <kbd>⌘ K</kbd>
          </label>
          <div className="dashboard-user">
            <button aria-label={t("nav.notifications")} className="icon-button" type="button"><Icon name="bell" size={20} /><span /></button>
            <div className="dashboard-user__avatar">{getInitials(user.name)}</div>
            <div><strong>{user.name}</strong><small>{t(roleLabelKey(role))}</small></div>
            <Icon name="chevron" size={15} />
          </div>
          <LanguageSwitcher className="dashboard-language" />
          <ThemeToggle className="dashboard-theme" />
        </header>

        <div className="dashboard-content">
          <div className="dashboard-welcome">
            <div>
              <span className="dashboard-date">{new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Tehran" }).format(new Date())}</span>
              <h1>{t(data.titleKey)}</h1>
              <p>{t(data.subtitleKey)}</p>
            </div>
            <button className="dashboard-primary-action" type="button"><Icon name="plus" size={18} /> {t(data.actionKey)}</button>
          </div>

          <section className="dashboard-stat-grid" aria-label="یک نگاه کلی">
            {data.stats.map((stat) => (
              <article className="dashboard-stat" key={stat.labelKey}>
                <div className={`dashboard-stat__icon dashboard-stat__icon--${stat.tone}`}><Icon name={stat.icon} size={21} /></div>
                <div className="dashboard-stat__value"><strong>{stat.value}</strong><Icon name="trend" size={17} /></div>
                <p>{t(stat.labelKey)}</p>
                <small>{stat.change}</small>
              </article>
            ))}
          </section>

          <div className="dashboard-layout-grid">
            <section className="dashboard-panel activity-panel" id="insights">
              <div className="dashboard-panel__header">
                <div><h2>{t("dash.weeklyActivity")}</h2><p>{t("dash.memberVisits")}</p></div>
                <button type="button">{t("dash.last7Days")} <span>⌄</span></button>
              </div>
              <div className="activity-summary"><strong>2,846</strong><span><Icon name="trend" size={15} /> 14.2%</span><small>نسبت به هفته قبل</small></div>
              <div className="activity-chart-wrap">
                <div className="chart-y-axis"><span>800</span><span>600</span><span>400</span><span>200</span><span>0</span></div>
                <svg className="activity-chart" viewBox="0 0 680 230" preserveAspectRatio="none" role="img" aria-label="نمودار فعالیت هفتگی اعضا">
                  <defs>
                    <linearGradient id="dashboardArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#bde65f" stopOpacity=".35" /><stop offset="1" stopColor="#bde65f" stopOpacity="0" /></linearGradient>
                  </defs>
                  <path className="activity-chart__grid" d="M0 10h680M0 62h680M0 114h680M0 166h680M0 218h680" />
                  <path className="activity-chart__area" d="M0 188C42 179 59 142 103 153s62-18 101-7 59 17 96-21 62-8 97-31 62-63 101-40 60 48 96 13 57-20 86-48V230H0Z" />
                  <path className="activity-chart__line" d="M0 188C42 179 59 142 103 153s62-18 101-7 59 17 96-21 62-8 97-31 62-63 101-40 60 48 96 13 57-20 86-48" />
                  <circle cx="498" cy="54" r="6" />
                  <line x1="498" x2="498" y1="54" y2="218" />
                </svg>
                <div className="chart-tooltip"><small>شنبه</small><strong>۶۸۴ مراجعه</strong></div>
                <div className="activity-days"><span>دوشنبه</span><span>سهشنبه</span><span>چهارشنبه</span><span>پنجشنبه</span><span>جمعه</span><span>شنبه</span><span>یکشنبه</span></div>
              </div>
            </section>

            <section className="dashboard-panel progress-panel" id="plans">
              <div className="dashboard-panel__header"><div><h2>{t("dash.monthlyGoal")}</h2><p>{t("dash.monthProgress")}</p></div><button aria-label="گزینههای بیشتر" className="more-button" type="button">•••</button></div>
              <div className="progress-ring" style={{ "--progress": "76%" } as CSSProperties}>
                <div><strong>76%</strong><span>{t("dash.monthProgress")}</span></div>
              </div>
              <div className="progress-copy">
                <strong>{t("dash.greatMomentum")}</strong>
                <p>{t("dash.visitsToTarget")}</p>
              </div>
              <div className="progress-legend"><span><i /> ۳٬۸۶۰ انجامشده</span><span><i /> هدف ۵٬۰۰۰</span></div>
            </section>
          </div>

          <section className="dashboard-panel schedule-panel" id="schedule">
            <div className="dashboard-panel__header">
              <div><h2>{t("dash.todaysSchedule")}</h2><p>۸ جلسه · امروز</p></div>
              <a href="#schedule">{t("landing.explorePlatform")} <Icon name="arrow" size={16} /></a>
            </div>
            <div className="schedule-list">
              {schedule.map((session) => (
                <article className="schedule-item" key={session.time}>
                  <div className="schedule-time"><strong>{session.time}</strong><span>{session.period}</span></div>
                  <div className={`schedule-line schedule-line--${session.tone}`} />
                  <div className={`schedule-icon schedule-icon--${session.tone}`}><Icon name={session.title.includes("خصوصی") ? "user" : "dumbbell"} size={20} /></div>
                  <div className="schedule-info"><strong>{session.title}</strong><span><Icon name="location" size={13} /> {session.meta}</span></div>
                  <div className="schedule-people">{session.initials.map((initial) => <span key={initial}>{initial}</span>)}</div>
                  <button aria-label={`باز کردن ${session.title}`} type="button"><Icon name="chevron" size={17} /></button>
                </article>
              ))}
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>© ۱۴۰۵ کوجیما</span>
            <div><Link href="/">{t("common.home")}</Link><a href="#settings">{t("common.helpCenter")}</a><a href="#settings">{t("common.privacy")}</a></div>
          </footer>
        </div>
      </section>
    </main>
  );
}
