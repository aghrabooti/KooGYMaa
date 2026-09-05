import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { requireGymAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { summarizePayments, monthlyRevenue as monthlyRevenueSeries } from "@/lib/finance";
import { formatMoney as formatMoneyFa } from "@/lib/fa";
import { faStatus } from "@/components/fa";

type PageProps = { params: Promise<{ gymId: string }> };

function formatMoney(value: number, currency = "IRR") {
  try {
    return new Intl.NumberFormat("fa-IR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      notation: value >= 1_000_000_000 ? "compact" : "standard",
    }).format(value);
  } catch {
    return `${value.toLocaleString("fa-IR")} ${currency}`;
  }
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(value);
}

export default async function GymOverviewPage({ params }: PageProps) {
  const { gymId } = await params;
  const { gym, user } = await requireGymAdminAccess(gymId);
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    activeMembers,
    activeTrainers,
    pendingMembers,
    pendingTrainers,
    activeSubscriptions,
    paymentRows,
    recentMembers,
    recentTrainers,
    expiringSubscriptions,
  ] = await Promise.all([
    prisma.gymMembership.count({ where: { gymId, status: "ACTIVE" } }),
    prisma.gymTrainer.count({ where: { gymId, status: "ACTIVE" } }),
    prisma.gymMembership.count({ where: { gymId, status: "PENDING" } }),
    prisma.gymTrainer.count({ where: { gymId, status: "PENDING" } }),
    prisma.subscription.count({ where: { gymId, status: "ACTIVE", endDate: { gt: now } } }),
    prisma.payment.findMany({
      where: { gymId },
      select: { status: true, type: true, amount: true, currency: true, paidAt: true, createdAt: true },
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

  // Item 3: revenue counts ONLY SUCCEEDED payments, split by currency, renewals + refunds included.
  const finance = summarizePayments(paymentRows as any[]);
  const currency = finance.currency;
  const totalRevenue = finance.net;
  const revenueTrend: Array<{ key: string; total: number; count: number }> = monthlyRevenueSeries(paymentRows as any[], 6, now);
  const monthlyRevenue = revenueTrend.map((row: { key: string; total: number }) => ({ label: new Date(`${row.key}-01T00:00:00Z`).toLocaleString("en", { month: "short" }), total: row.total }));
  const maxRevenue = Math.max(...monthlyRevenue.map((month: { total: number }) => month.total), 1);
  const revenueNote = finance.refunded > 0 ? `net of ${formatMoneyFa(finance.refunded, currency)} refunds` : `${finance.counts.succeeded} successful payments`;
  const pending = [
    ...recentMembers.map((membership: any) => ({
      id: membership.id,
      href: `/admin/gyms/${gymId}/members`,
      name: membership.user.name,
      detail: membership.user.email,
      requestedAt: membership.requestedAt,
      type: "عضو",
    })),
    ...recentTrainers.map((membership: any) => ({
      id: membership.id,
      href: `/admin/gyms/${gymId}/trainers`,
      name: membership.trainer.user.name,
      detail: membership.trainer.user.email,
      requestedAt: membership.requestedAt,
      type: "مربی",
    })),
  ].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime()).slice(0, 5);

  const stats: Array<{ change: string; icon: IconName; label: string; tone: string; value: string }> = [
    { label: "اعضای فعال", value: activeMembers.toLocaleString("fa-IR"), change: `${pendingMembers} در انتظار بررسی`, icon: "users", tone: "lime" },
    { label: "مربی‌های فعال", value: activeTrainers.toLocaleString("fa-IR"), change: `${pendingTrainers} در انتظار بررسی`, icon: "dumbbell", tone: "orange" },
    { label: "اشتراک‌های فعال", value: activeSubscriptions.toLocaleString("fa-IR"), change: `${expiringSubscriptions.length} این هفته منقضی می‌شود`, icon: "credit-card", tone: "violet" },
    { label: "درآمد خالص (پرداخت‌شده)", value: formatMoneyFa(totalRevenue, currency), change: revenueNote, icon: "trend", tone: "blue" },
  ];

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><span>{now.toLocaleDateString("fa-IR", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</span><h1>Good to see you, {user.name.split(" ")[0]}.</h1><p>Here&apos;s the latest from {gym.name}.</p></div>
        <Link className="admin-primary-button" href={`/admin/gyms/${gymId}/members`}><Icon name="plus" size={17} /> مدیریت اعضا</Link>
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
          <div className="admin-panel__heading"><div><h2>نمای درآمد</h2><p>پرداخت‌های موفق · شش ماه گذشته · خالص پس از بازپرداخت</p></div><span>{currency}</span></div>
          <div className="admin-revenue-total"><strong>{formatMoneyFa(totalRevenue, currency)}</strong><span>درآمد خالص پرداخت‌شده</span></div><p className="admin-note">تمدیدها: {finance.renewalsSucceeded} · بازپرداخت: {formatMoneyFa(finance.refunded, currency)}</p>
          <div className="admin-bar-chart">
            {monthlyRevenue.map((month) => (
              <div key={month.label}><span title={formatMoney(month.total, currency)} style={{ height: `${Math.max(8, (month.total / maxRevenue) * 100)}%` }} /><small>{month.label}</small></div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__heading"><div><h2>درخواست‌های در انتظار</h2><p>{pendingMembers + pendingTrainers} نیاز به بررسی</p></div><Icon name="bell" size={18} /></div>
          {pending.length ? <div className="admin-request-list">{pending.map((item) => (
            <Link href={item.href} key={`${item.type}-${item.id}`}>
              <span className="admin-avatar">{item.name.slice(0, 2).toUpperCase()}</span>
              <div><strong>{item.name}</strong><small>{faStatus(item.type)} · {item.detail}</small></div>
              <span>{formatDate(item.requestedAt)} <Icon name="chevron" size={13} /></span>
            </Link>
          ))}</div> : <div className="admin-empty-small"><Icon name="check" size={22} /><strong>همه‌چیز به‌روز است</strong><span>درخواست در انتظاری وجود ندارد.</span></div>}
        </section>
      </div>

      <div className="admin-bottom-grid">
        <section className="admin-panel">
          <div className="admin-panel__heading"><div><h2>رو به انقضا</h2><p>اشتراک‌هایی که در ۷ روز آینده تمام می‌شوند</p></div><Link href={`/admin/gyms/${gymId}/subscriptions`}>مشاهده همه <Icon name="arrow" size={14} /></Link></div>
          {expiringSubscriptions.length ? <div className="admin-expiring-list">{expiringSubscriptions.map((subscription: any) => (
            <div key={subscription.id}><span><Icon name="clock" size={16} /></span><div><strong>{subscription.subscriber.name}</strong><small>{subscription.plan.name}</small></div><b>{formatDate(subscription.endDate)}</b></div>
          ))}</div> : <div className="admin-empty-row"><Icon name="shield" size={18} /> این هفته اشتراکی منقضی نمی‌شود.</div>}
        </section>

        <section className="admin-panel admin-quick-panel">
          <div className="admin-panel__heading"><div><h2>اقدامات سریع</h2><p>به کارهای روزانه برگردید</p></div></div>
          <div className="admin-quick-grid">
            <Link href={`/admin/gyms/${gymId}/plans`}><Icon name="clipboard" size={18} /><span><strong>ساخت طرح</strong><small>قیمت‌گذاری و دسترسی</small></span><Icon name="chevron" size={14} /></Link>
            <Link href={`/admin/gyms/${gymId}/trainers`}><Icon name="dumbbell" size={18} /><span><strong>مرور مربی‌ها</strong><small>درخواست‌ها و فهرست</small></span><Icon name="chevron" size={14} /></Link>
            <Link href={`/admin/gyms/${gymId}/settings`}><Icon name="settings" size={18} /><span><strong>مشخصات باشگاه</strong><small>تماس و نمایش</small></span><Icon name="chevron" size={14} /></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
