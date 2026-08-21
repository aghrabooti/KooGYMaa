import Link from "next/link";
import { Icon } from "@/components/icon";
import { CancelSubscriptionButton, CheckoutButton } from "@/components/user/commerce-controls";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function money(value: number, currency: string) {
  try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${value.toLocaleString()} ${currency}`; }
}

export default async function MemberSubscriptionsPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const user = await requireCurrentUser(["USER"]);
  const paymentResult = (await searchParams).payment;
  const now = new Date();
  const [subscriptions, payments] = await Promise.all([
    prisma.subscription.findMany({
      where: { subscriberId: user.id },
      select: { id: true, status: true, pricePaid: true, currency: true, startDate: true, endDate: true, autoRenew: true, cancelledAt: true, gym: { select: { id: true, name: true, city: true } }, plan: { select: { id: true, name: true, audience: true, durationDays: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      select: { id: true, status: true, type: true, amount: true, currency: true, provider: true, paidAt: true, refundedAt: true, createdAt: true, gym: { select: { name: true } }, plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  const active = subscriptions.filter((item) => item.status === "ACTIVE" && item.endDate > now);

  return <div className="member-page">
    <header className="member-page__heading"><div><span>MEMBERSHIPS</span><h1>Subscriptions & payments</h1><p>Review access, renewals, cancellations, and transaction history.</p></div><Link className="member-primary-button" href="/user/gyms">Explore gyms <Icon name="arrow" size={14}/></Link></header>
    {paymentResult && <div className={`payment-flash payment-flash--${paymentResult}`}><Icon name={paymentResult === "success" ? "check" : "shield"} size={17}/>{paymentResult === "success" ? "Payment completed and subscription activated." : "Payment was declined. You can safely try again."}</div>}
    <section className="member-progress-metrics"><article><span><Icon name="credit-card" size={19}/></span><small>Active subscriptions</small><strong>{active.length}</strong><p>Current paid access</p></article><article><span><Icon name="clock" size={19}/></span><small>Nearest expiry</small><strong>{active[0]?`${Math.max(0,Math.ceil((active[0].endDate.getTime()-now.getTime())/86400000))}d`:"—"}</strong><p>{active[0]?.gym.name||"No active access"}</p></article><article><span><Icon name="trend" size={19}/></span><small>Successful payments</small><strong>{payments.filter((item)=>item.status==="SUCCEEDED").length}</strong><p>{payments[0]?money(payments.filter((item)=>item.status==="SUCCEEDED").reduce((sum,item)=>item.currency===payments[0].currency?sum+item.amount:sum,0),payments[0].currency):"No transactions"}</p></article><article><span><Icon name="bolt" size={19}/></span><small>Auto-renew enabled</small><strong>{active.filter(item=>item.autoRenew).length}</strong><p>Manage access below</p></article></section>
    <section className="member-panel member-subscription-list">{subscriptions.length?subscriptions.map(subscription=><article key={subscription.id}><span className="member-subscription-icon"><Icon name="building" size={20}/></span><div><small>{subscription.plan.audience} PLAN</small><h2>{subscription.plan.name}</h2><p><Link href={`/user/gyms/${subscription.gym.id}`}>{subscription.gym.name}</Link>{subscription.gym.city?` · ${subscription.gym.city}`:""}</p></div><div><strong>{money(subscription.pricePaid,subscription.currency)}</strong><small>{subscription.startDate.toLocaleDateString()} – {subscription.endDate.toLocaleDateString()}</small></div><span className={`member-status member-status--${subscription.status.toLowerCase()}`}>{subscription.status}</span><div className="subscription-row-actions">{subscription.status==="ACTIVE"&&<CheckoutButton planId={subscription.plan.id} renewalSubscriptionId={subscription.id}/>} {["PENDING","ACTIVE","PAST_DUE"].includes(subscription.status)&&<CancelSubscriptionButton subscriptionId={subscription.id}/>}</div></article>):<div className="member-empty"><Icon name="credit-card" size={26}/><h2>No subscriptions yet</h2><p>Browse gyms to find a membership plan.</p></div>}</section>
    <section className="member-panel payment-history"><div className="member-panel__heading"><div><h2>Payment history</h2><p>{payments.length} transactions</p></div></div>{payments.length?<div>{payments.map(payment=><article key={payment.id}><span><Icon name="credit-card" size={16}/></span><div><strong>{payment.plan.name}</strong><small>{payment.gym.name} · {payment.provider.toUpperCase()} · {payment.type}</small></div><b>{money(payment.amount,payment.currency)}</b><span className={`member-status member-status--${payment.status.toLowerCase()}`}>{payment.status}</span><small>{(payment.paidAt||payment.createdAt).toLocaleDateString()}</small></article>)}</div>:<p className="member-empty-line">Completed and attempted payments will appear here.</p>}</section>
  </div>;
}
