import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { GymMembershipAction } from "@/components/user/market-actions";
import { CheckoutButton, ReviewEditor } from "@/components/user/commerce-controls";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { faStatus } from "@/components/fa";
import { toFaDigits } from "@/lib/fa";
import { faCountry } from "@/components/fa";

type PageProps = { params: Promise<{ gymId: string }> };
function money(value: number, currency: string) { try { return new Intl.NumberFormat("fa-IR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); } catch { return `${value.toLocaleString("fa-IR")} ${currency}`; } }
export default async function GymDetailPage({ params }: PageProps) {
  const user = await requireCurrentUser(["USER"]); const { gymId } = await params;
  const gym = await prisma.gym.findFirst({
    where: { id: gymId, status: "ACTIVE" },
    select: {
      id: true, name: true, description: true, email: true, phone: true, address: true, city: true, country: true,
      reviews: { select: { id: true, score: true, comment: true, verified: true, createdAt: true, author: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 12 },
      subscriptionPlans: { where: { audience: "MEMBER", isActive: true }, select: { id: true, name: true, description: true, price: true, currency: true, durationDays: true }, orderBy: { price: "asc" } },
      trainers: { where: { status: "ACTIVE", trainer: { isAvailable: true } }, select: { trainer: { select: { id: true, specialty: true, experienceYears: true, hourlyRate: true, currency: true, user: { select: { name: true } }, reviews: { select: { score: true } } } } }, take: 8 },
      memberships: { where: { userId: user.id }, select: { status: true, requestedAt: true, startedAt: true }, take: 1 },
      _count: { select: { memberships: { where: { status: "ACTIVE" } }, trainers: { where: { status: "ACTIVE" } } } },
    },
  });
  if (!gym) notFound(); const membership = gym.memberships[0]; const currentReview = gym.reviews.find((review: any) => review.author.id === user.id); const rating = gym.reviews.length ? gym.reviews.reduce((sum: any, review: any) => sum + review.score, 0) / gym.reviews.length : 0;
  return <div className="member-page"><Link className="member-back" href="/user/gyms"><Icon name="chevron" size={14} /> بازگشت به باشگاه‌ها</Link><section className="market-detail-hero"><div className="market-detail-mark"><Icon name="building" size={38} /></div><div><small>{gym.city || "مکان ثبت نشده"}, {faCountry(gym.country)}</small><h1>{gym.name}</h1><p>{gym.description || "هنوز توضیحی اضافه نشده است."}</p><div><span>★ {rating ? toFaDigits(rating.toFixed(1)) : "جدید"}</span><span>{gym._count.memberships} عضو</span><span>{gym._count.trainers} مربی</span></div></div><aside><GymMembershipAction gymId={gym.id} status={membership?.status} />{membership && <span className={`member-status member-status--${membership.status.toLowerCase()}`}>{faStatus(membership.status)}</span>}</aside></section><div className="market-detail-grid"><section className="member-panel"><div className="member-panel__heading"><div><h2>طرح‌های عضویت</h2><p>سطح دسترسی مناسب خودتان را انتخاب کنید</p></div></div><div className="market-plan-list">{gym.subscriptionPlans.map((plan: any) => <article key={plan.id}><div><small>{plan.durationDays} روز</small><h3>{plan.name}</h3><p>{plan.description || "دسترسی عضویت باشگاه."}</p></div><strong>{money(plan.price, plan.currency)}</strong><CheckoutButton planId={plan.id} /></article>)}{!gym.subscriptionPlans.length && <p className="member-empty-line">هنوز طرح عضویت عمومی وجود ندارد.</p>}</div></section><section className="member-panel market-contact"><div className="member-panel__heading"><div><h2>مکان و تماس</h2><p>با باشگاه در تماس باشید</p></div></div><div><p><Icon name="location" size={15} /> {gym.address || "نشانی ثبت نشده"}</p><p><Icon name="mail" size={15} /> {gym.email || "ایمیل ثبت نشده"}</p><p><Icon name="user" size={15} /> {gym.phone || "تلفن ثبت نشده است"}</p></div></section></div><section className="member-panel market-trainer-strip"><div className="member-panel__heading"><div><h2>تیم مربی‌گری</h2><p>مربی‌های موجود این باشگاه</p></div><Link href={`/user/trainers?gym=${gym.id}`}>مشاهده همه <Icon name="arrow" size={13} /></Link></div><div>{gym.trainers.map(({ trainer}: any) => { const trainerRating = trainer.reviews.length ? trainer.reviews.reduce((sum: any, review: any) => sum + review.score, 0) / trainer.reviews.length : 0; return <Link href={`/user/trainers/${trainer.id}`} key={trainer.id}><span>{trainer.user.name.slice(0,2).toUpperCase()}</span><strong>{trainer.user.name}</strong><small>{trainer.specialty || "تناسب‌اندام عمومی"}</small><b>★ {trainerRating ? toFaDigits(trainerRating.toFixed(1)) : "جدید"}</b></Link>; })}</div></section><section className="member-panel market-reviews"><div className="member-panel__heading"><div><h2>دیدگاه‌های اعضا</h2><p>{gym.reviews.length} دیدگاه اخیر</p></div></div><ReviewEditor type="gym" targetId={gym.id} verified={Boolean(membership?.startedAt)} existing={currentReview ? { score: currentReview.score, comment: currentReview.comment } : undefined} /><div>{gym.reviews.map((review: any) => <blockquote key={review.id}><header><strong>{review.author.name}</strong><span>{"★".repeat(review.score)}</span><small>{review.createdAt.toLocaleDateString("fa-IR")}</small></header><p>{review.comment || "توضیح متنی ثبت نشده است."}</p></blockquote>)}</div></section></div>;
}
