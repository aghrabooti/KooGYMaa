import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { requireGymAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ gymId: string }> };

function formatMoney(value: number, currency = "IRR") {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      notation: value >= 1_000_000_000 ? "compact" : "standard",
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(value);
}

export default async function GymOverviewPage({ params }: PageProps) {
  const { gymId } = await params;
  const { gym, user } = await requireGymAdminAccess(gymId);
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    activeMembers,
    activeTrainers,
    pendingMembers,
    pendingTrainers,
    activeSubscriptions,
    revenueGroups,
    recentSubscriptions,
    recentMembers,
    recentTrainers,
    expiringSubscriptions,
    rating,
  ] = await Promise.all([
    prisma.gymMembership.count({ where: { gymId, status: "ACTIVE" } }),
    prisma.gymTrainer.count({ where: { gymId, status: "ACTIVE" } }),
    prisma.gymMembership.count({ where: { gymId, status: "PENDING" } }),
    prisma.gymTrainer.count({ where: { gymId, status: "PENDING" } }),
    prisma.subscription.count({ where: { gymId, status: "ACTIVE", endDate: { gt: now } } }),
    prisma.subscription.groupBy({
      by: ["currency"],
      where: { gymId, status: { in: ["ACTIVE", "EXPIRED"] } },
      _sum: { pricePaid: true },
      _count: true,
    }),
    prisma.subscription.findMany({
      where: { gymId, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, pricePaid: true, currency: true },
    }),
    prisma.gymMembership.findMany({
      where: { gymId, status: "PENDING" },
      select: { id: true, requestedAt: true, user: { select: { name: true, email: true } } },
      take: 4,
      orderBy: { requestedAt: "desc" },
    }),
    prisma.gymTrainer.findMany({
      where: { gymId, status: "PENDING" },
      select: { id: true, requestedAt: true, trainer: { select: { user: { select: { name: true, email: true } } } } },
      take: 4,
      orderBy: { requestedAt: "desc" },
    }),
    prisma.subscription.findMany({
      where: { gymId, status: "ACTIVE", endDate: { gt: now, lte: inSevenDays } },
      select: {
        id: true,
        endDate: true,
        subscriber: { select: { name: true } },
        plan: { select: { name: true } },
      },
      take: 5,
      orderBy: { endDate: "asc" },
    }),
    prisma.gymReview.aggregate({ where: { gymId }, _avg: { score: true }, _count: true }),
  ]);

  const primaryRevenue = [...revenueGroups].sort((a, b) => b._count - a._count)[0];
  const currency = primaryRevenue?.currency || "IRR";
  const totalRevenue = primaryRevenue?._sum.pricePaid || 0;
  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const total = recentSubscriptions
      .filter((subscription) => subscription.currency === currency && subscription.createdAt.getMonth() === date.getMonth() && subscription.createdAt.getFullYear() === date.getFullYear())
      .reduce((sum, subscription) => sum + subscription.pricePaid, 0);
    return { label: date.toLocaleString("en", { month: "short" }), total };
  });
  const maxRevenue = Math.max(...monthlyRevenue.map((month) => month.total), 1);
  const pending = [
    ...recentMembers.map((membership) => ({
      id: membership.id,
      href: `/admin/gyms/${gymId}/members`,
      name: membership.user.name,
      detail: membership.user.email,
      requestedAt: membership.requestedAt,
      type: "Member",
    })),
    ...recentTrainers.map((membership) => ({
      id: membership.id,
      href: `/admin/gyms/${gymId}/trainers`,
      name: membership.trainer.user.name,
      detail: membership.trainer.user.email,
      requestedAt: membership.requestedAt,
      type: "Trainer",
    })),
  ].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime()).slice(0, 5);

  const stats: Array<{ change: string; icon: IconName; label: string; tone: string; value: string }> = [
    { label: "Active members", value: activeMembers.toLocaleString(), change: `${pendingMembers} awaiting review`, icon: "users", tone: "lime" },
    { label: "Active trainers", value: activeTrainers.toLocaleString(), change: `${pendingTrainers} awaiting review`, icon: "dumbbell", tone: "orange" },
    { label: "Active subscriptions", value: activeSubscriptions.toLocaleString(), change: `${expiringSubscriptions.length} expire this week`, icon: "credit-card", tone: "violet" },
    { label: "Recorded revenue", value: formatMoney(totalRevenue, currency), change: rating._count ? `${rating._avg.score?.toFixed(1)} average rating` : "No ratings yet", icon: "trend", tone: "blue" },
  ];

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><span>{now.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</span><h1>Good to see you, {user.name.split(" ")[0]}.</h1><p>Here&apos;s the latest from {gym.name}.</p></div>
        <Link className="admin-primary-button" href={`/admin/gyms/${gymId}/members`}><Icon name="plus" size={17} /> Manage members</Link>
      </header>

      <section className="admin-metric-grid">
        {stats.map((stat) => (
          <article className="admin-metric-card" key={stat.label}>
            <span className={`admin-metric-card__icon admin-tone--${stat.tone}`}><Icon name={stat.icon} size={20} /></span>
            <small>{stat.label}</small><strong>{stat.value}</strong><p>{stat.change}</p>
          </article>
        ))}
      </section>

      <div className="admin-overview-grid">
        <section className="admin-panel admin-revenue-panel">
          <div className="admin-panel__heading"><div><h2>Revenue overview</h2><p>Subscriptions created in the last six months</p></div><span>{currency}</span></div>
          <div className="admin-revenue-total"><strong>{formatMoney(totalRevenue, currency)}</strong><span>all recorded revenue</span></div>
          <div className="admin-bar-chart">
            {monthlyRevenue.map((month) => (
              <div key={month.label}><span title={formatMoney(month.total, currency)} style={{ height: `${Math.max(8, (month.total / maxRevenue) * 100)}%` }} /><small>{month.label}</small></div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__heading"><div><h2>Pending requests</h2><p>{pendingMembers + pendingTrainers} require attention</p></div><Icon name="bell" size={18} /></div>
          {pending.length ? <div className="admin-request-list">{pending.map((item) => (
            <Link href={item.href} key={`${item.type}-${item.id}`}>
              <span className="admin-avatar">{item.name.slice(0, 2).toUpperCase()}</span>
              <div><strong>{item.name}</strong><small>{item.type} · {item.detail}</small></div>
              <span>{formatDate(item.requestedAt)} <Icon name="chevron" size={13} /></span>
            </Link>
          ))}</div> : <div className="admin-empty-small"><Icon name="check" size={22} /><strong>You&apos;re all caught up</strong><span>No pending requests.</span></div>}
        </section>
      </div>

      <div className="admin-bottom-grid">
        <section className="admin-panel">
          <div className="admin-panel__heading"><div><h2>Expiring soon</h2><p>Subscriptions ending in the next 7 days</p></div><Link href={`/admin/gyms/${gymId}/subscriptions`}>View all <Icon name="arrow" size={14} /></Link></div>
          {expiringSubscriptions.length ? <div className="admin-expiring-list">{expiringSubscriptions.map((subscription) => (
            <div key={subscription.id}><span><Icon name="clock" size={16} /></span><div><strong>{subscription.subscriber.name}</strong><small>{subscription.plan.name}</small></div><b>{formatDate(subscription.endDate)}</b></div>
          ))}</div> : <div className="admin-empty-row"><Icon name="shield" size={18} /> No subscriptions expire this week.</div>}
        </section>

        <section className="admin-panel admin-quick-panel">
          <div className="admin-panel__heading"><div><h2>Quick actions</h2><p>Jump back into daily operations</p></div></div>
          <div className="admin-quick-grid">
            <Link href={`/admin/gyms/${gymId}/plans`}><Icon name="clipboard" size={18} /><span><strong>Create a plan</strong><small>Pricing and access</small></span><Icon name="chevron" size={14} /></Link>
            <Link href={`/admin/gyms/${gymId}/trainers`}><Icon name="dumbbell" size={18} /><span><strong>Review trainers</strong><small>Applications and roster</small></span><Icon name="chevron" size={14} /></Link>
            <Link href={`/admin/gyms/${gymId}/settings`}><Icon name="settings" size={18} /><span><strong>Gym details</strong><small>Contact and visibility</small></span><Icon name="chevron" size={14} /></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
