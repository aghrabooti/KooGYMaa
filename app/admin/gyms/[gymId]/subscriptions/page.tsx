import { CreateSubscription, SubscriptionActions } from "@/components/admin/subscription-controls";
import { Icon } from "@/components/icon";
import { requireGymAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ gymId: string }> };

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}

function date(value: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

export default async function SubscriptionsPage({ params }: PageProps) {
  const { gymId } = await params;
  await requireGymAdminAccess(gymId);
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [subscriptions, plans] = await Promise.all([
    prisma.subscription.findMany({
      where: { gymId },
      select: {
        id: true,
        status: true,
        pricePaid: true,
        currency: true,
        startDate: true,
        endDate: true,
        autoRenew: true,
        subscriber: { select: { name: true, email: true, role: true } },
        plan: { select: { name: true, audience: true } },
      },
      orderBy: [{ status: "asc" }, { endDate: "asc" }],
      take: 250,
    }),
    prisma.subscriptionPlan.findMany({
      where: { gymId, isActive: true },
      select: { id: true, name: true, audience: true },
      orderBy: [{ audience: "asc" }, { price: "asc" }],
    }),
  ]);
  const active = subscriptions.filter((item) => item.status === "ACTIVE" && item.endDate > now);
  const expiring = active.filter((item) => item.endDate <= soon);
  const revenue = subscriptions.reduce((sum, item) => sum + item.pricePaid, 0);
  const currency = subscriptions[0]?.currency || "IRR";

  return (
    <div className="admin-page">
      <header className="admin-page__heading admin-page__heading--compact">
        <div><span>BILLING & ACCESS</span><h1>Subscriptions</h1><p>Activate, extend, and cancel access for members and trainers.</p></div>
        <CreateSubscription gymId={gymId} plans={plans} />
      </header>

      <section className="admin-summary-strip">
        <div><span>Active</span><strong>{active.length}</strong></div>
        <div><span>Expiring this week</span><strong>{expiring.length}</strong></div>
        <div><span>Auto-renew</span><strong>{active.filter((item) => item.autoRenew).length}</strong></div>
        <div><span>Recorded revenue</span><strong>{money(revenue, currency)}</strong></div>
      </section>

      <section className="admin-panel admin-table-panel">
        {subscriptions.length ? <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th>Subscriber</th><th>Plan</th><th>Status</th><th>Paid</th><th>Period</th><th>Renewal</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{subscriptions.map((subscription) => <tr key={subscription.id}>
            <td><div className="admin-person"><span>{subscription.subscriber.name.slice(0, 2).toUpperCase()}</span><div><strong>{subscription.subscriber.name}</strong><small>{subscription.subscriber.email} · {subscription.subscriber.role}</small></div></div></td>
            <td><div className="admin-table-stack"><strong>{subscription.plan.name}</strong><small>{subscription.plan.audience}</small></div></td>
            <td><span className={`admin-status admin-status--${subscription.status.toLowerCase().replace("_", "-")}`}>{subscription.status}</span></td>
            <td>{money(subscription.pricePaid, subscription.currency)}</td>
            <td><div className="admin-table-stack"><strong>{date(subscription.endDate)}</strong><small>From {date(subscription.startDate)}</small></div></td>
            <td>{subscription.autoRenew ? <span className="admin-renew"><Icon name="check" size={13} /> On</span> : <span className="admin-muted">Off</span>}</td>
            <td><SubscriptionActions autoRenew={subscription.autoRenew} endpoint={`/api/admin/gyms/${gymId}/subscriptions/${subscription.id}`} status={subscription.status} /></td>
          </tr>)}</tbody>
        </table></div> : <div className="admin-empty-table"><span><Icon name="credit-card" size={27} /></span><h2>No subscriptions yet</h2><p>Create a subscription after adding at least one plan.</p></div>}
      </section>
    </div>
  );
}
