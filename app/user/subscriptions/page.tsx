import Link from "next/link";
import { Icon } from "@/components/icon";
import { AutoRenewToggle, CancelSubscriptionButton, CheckoutButton, PauseSubscriptionButton, ReceiptLink } from "@/components/user/commerce-controls";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { faStatus } from "@/components/fa";

function money(value: number, currency: string) {
  try { return new Intl.NumberFormat("fa-IR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${value.toLocaleString("fa-IR")} ${currency}`; }
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
  const active = subscriptions
    .filter((item: any) => item.status === "ACTIVE" && item.endDate > now)
    .sort((a: any, b: any) => a.endDate.getTime() - b.endDate.getTime()); // nearest expiry first (item 2)

  return <div className="member-page">
    <header className="member-page__heading"><div><span>عضویت‌ها</span><h1>اشتراک‌ها و پرداخت‌ها</h1><p>دسترسی‌ها، تمدیدها، لغوها و سوابق تراکنش‌ها را مرور کنید.</p></div><Link className="member-primary-button" href="/user/gyms">مشاهده باشگاه‌ها <Icon name="arrow" size={14}/></Link></header>
    {paymentResult && <div className={`payment-flash payment-flash--${paymentResult}`}><Icon name={paymentResult === "success" ? "check" : "shield"} size={17}/>{paymentResult === "success" ? "پرداخت انجام و اشتراک فعال شد." : "پرداخت رد شد. می‌توانید با خیال راحت دوباره تلاش کنید."}</div>}
    <section className="member-progress-metrics"><article><span><Icon name="credit-card" size={19}/></span><small>اشتراک‌های فعال</small><strong>{active.length}</strong><p>دسترسی پرداختی فعلی</p></article><article><span><Icon name="clock" size={19}/></span><small>نزدیک‌ترین انقضا</small><strong>{active[0]?`${Math.max(0,Math.ceil((active[0].endDate.getTime()-now.getTime())/86400000))}d`:"—"}</strong><p>{active[0]?.gym.name||"دسترسی فعالی وجود ندارد"}</p></article><article><span><Icon name="trend" size={19}/></span><small>پرداخت‌های موفق</small><strong>{payments.filter((item: any) =>item.status==="SUCCEEDED").length}</strong><p>{payments[0]?money(payments.filter((item: any) =>item.status==="SUCCEEDED").reduce((sum: any,item: any) =>item.currency===payments[0].currency?sum+item.amount:sum,0),payments[0].currency):"تراکنشی ثبت نشده است"}</p></article><article><span><Icon name="bolt" size={19}/></span><small>تمدید خودکار فعال است</small><strong>{active.filter((item: any) =>item.autoRenew).length}</strong><p>دسترسی‌ها را پایین‌تر مدیریت کنید</p></article></section>
    <section className="member-panel member-subscription-list">{subscriptions.length?subscriptions.map((subscription: any) =><article key={subscription.id}><span className="member-subscription-icon"><Icon name="building" size={20}/></span><div><small>{subscription.plan.audience} PLAN</small><h2>{subscription.plan.name}</h2><p><Link href={`/user/gyms/${subscription.gym.id}`}>{subscription.gym.name}</Link>{subscription.gym.city?` · ${subscription.gym.city}`:""}</p></div><div><strong>{money(subscription.pricePaid,subscription.currency)}</strong><small>{subscription.startDate.toLocaleDateString("fa-IR")} – {subscription.endDate.toLocaleDateString("fa-IR")}</small></div><span className={`member-status member-status--${subscription.status.toLowerCase()}`}>{faStatus(subscription.status)}</span><div className="subscription-row-actions">{subscription.status==="ACTIVE"&&<CheckoutButton planId={subscription.plan.id} renewalSubscriptionId={subscription.id}/>} {subscription.status==="ACTIVE"&&<PauseSubscriptionButton subscriptionId={subscription.id}/>} {subscription.status==="ACTIVE"&&<AutoRenewToggle autoRenew={subscription.autoRenew} subscriptionId={subscription.id}/>} <ReceiptLink subscriptionId={subscription.id}/> {["PENDING","ACTIVE","PAST_DUE"].includes(subscription.status)&&<CancelSubscriptionButton subscriptionId={subscription.id}/>}</div></article>):<div className="member-empty"><Icon name="credit-card" size={26}/><h2>هنوز اشتراکی ثبت نشده است</h2><p>برای یافتن طرح عضویت، باشگاه‌ها را بگردید.</p></div>}</section>
    <section className="member-panel payment-history"><div className="member-panel__heading"><div><h2>سوابق پرداخت</h2><p>{payments.length} transactions</p></div></div>{payments.length?<div>{payments.map((payment: any) =><article key={payment.id}><span><Icon name="credit-card" size={16}/></span><div><strong>{payment.plan.name}</strong><small>{payment.gym.name} · {payment.provider.toUpperCase()} · {faStatus(payment.type)}</small></div><b>{money(payment.amount,payment.currency)}</b><span className={`member-status member-status--${payment.status.toLowerCase()}`}>{faStatus(payment.status)}</span><small>{(payment.paidAt||payment.createdAt).toLocaleDateString("fa-IR")}</small></article>)}</div>:<p className="member-empty-line">پرداخت‌های موفق و تلاش‌ها اینجا نمایش داده می‌شوند.</p>}</section>
  </div>;
}
