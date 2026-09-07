import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { TrainerRequestAction } from "@/components/user/market-actions";
import { ReviewEditor } from "@/components/user/commerce-controls";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { faStatus } from "@/components/fa";
import { toFaDigits } from "@/lib/fa";

type PageProps = { params: Promise<{ trainerId: string }> };
const days = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
function clock(minutes: number) { const s = `${String(Math.floor(minutes / 60)).padStart(2,"0")}:${String(minutes % 60).padStart(2,"0")}`; return s.replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]); }
function money(value: number, currency: string) { try { return new Intl.NumberFormat("fa-IR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); } catch { return `${value.toLocaleString("fa-IR")} ${currency}`; } }
export default async function TrainerDetailPage({ params }: PageProps) {
  const user = await requireCurrentUser(["USER"]); const { trainerId } = await params;
  const [trainer, memberGyms] = await Promise.all([
    prisma.trainerProfile.findFirst({
      where: { id: trainerId, user: { status: "ACTIVE", role: "TRAINER" } },
      select: {
        id: true, bio: true, specialty: true, experienceYears: true, hourlyRate: true, currency: true, isAvailable: true,
        user: { select: { name: true } },
        gyms: { where: { status: "ACTIVE" }, select: { gym: { select: { id: true, name: true, city: true } } } },
        availability: { where: { isActive: true }, select: { dayOfWeek: true, startMinutes: true, endMinutes: true, timezone: true }, orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }] },
        reviews: { select: { id: true, score: true, comment: true, verified: true, createdAt: true, author: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
        clients: { where: { userId: user.id }, select: { status: true, gymId: true, startedAt: true }, take: 1 },
        _count: { select: { clients: { where: { status: "ACTIVE" } }, workoutPlans: { where: { status: "ACTIVE" } } } },
      },
    }),
    prisma.gymMembership.findMany({ where: { userId: user.id, status: "ACTIVE" }, select: { gym: { select: { id: true, name: true } } } }),
  ]);
  if (!trainer) notFound(); const relationship = trainer.clients[0]; const currentReview = trainer.reviews.find((review: any) => review.author.id === user.id); const rating = trainer.reviews.length ? trainer.reviews.reduce((sum: any, review: any) =>sum+review.score,0)/trainer.reviews.length : 0; const sharedGyms = trainer.gyms.map((item: any) =>item.gym).filter((gym: any) =>memberGyms.some((membership: any) =>membership.gym.id===gym.id));
  return <div className="member-page"><Link className="member-back" href="/user/trainers"><Icon name="chevron" size={14}/> بازگشت به مربی‌ها</Link><section className="trainer-detail-hero"><div className="trainer-detail-avatar">{trainer.user.name.slice(0,2).toUpperCase()}<i className={trainer.isAvailable?"online":""}/></div><div><small>{trainer.specialty||"تناسب‌اندام عمومی"}</small><h1>{trainer.user.name}</h1><p>{trainer.bio||"هنوز زندگی‌نامه مربی ثبت نشده است."}</p><div><span>★ {rating ? toFaDigits(rating.toFixed(1)) : "جدید"}</span><span>{trainer.experienceYears||0} سال سابقه</span><span>{trainer._count.clients} مراجعان فعال</span></div></div><aside>{trainer.hourlyRate!==null&&<><strong>{money(trainer.hourlyRate,trainer.currency)}</strong><span>در ساعت</span></>}<TrainerRequestAction gyms={sharedGyms} trainerId={trainer.id} status={relationship?.status}/>{relationship&&<b className={`member-status member-status--${relationship.status.toLowerCase()}`}>{faStatus(relationship.status)}</b>}</aside></section><div className="trainer-detail-grid"><section className="member-panel"><div className="member-panel__heading"><div><h2>مکان‌های مربی‌گری</h2><p>باشگاه‌هایی که این مربی در آن‌ها فعال است</p></div></div><div className="trainer-location-list">{trainer.gyms.map(({gym}: any) =><Link href={`/user/gyms/${gym.id}`} key={gym.id}><span><Icon name="building" size={17}/></span><div><strong>{gym.name}</strong><small>{gym.city||"مکان ثبت نشده"}</small></div><Icon name="chevron" size={14}/></Link>)}</div></section><section className="member-panel"><div className="member-panel__heading"><div><h2>دسترسی هفتگی</h2><p>{trainer.availability[0]?.timezone||"ساعت محلی"}</p></div></div><div className="trainer-availability-public">{trainer.availability.map((slot: any) =><div key={`${slot.dayOfWeek}-${slot.startMinutes}`}><strong>{days[slot.dayOfWeek]}</strong><span>{clock(slot.startMinutes)}–{clock(slot.endMinutes)}</span></div>)}{!trainer.availability.length&&<p className="member-empty-line">ساعات دسترسی منتشر نشده است.</p>}</div></section></div><section className="member-panel market-reviews"><div className="member-panel__heading"><div><h2>دیدگاه‌های مراجعان</h2><p>{trainer.reviews.length} دیدگاه اخیر</p></div></div><ReviewEditor type="trainer" targetId={trainer.id} verified={Boolean(relationship?.startedAt)} existing={currentReview ? { score: currentReview.score, comment: currentReview.comment } : undefined} /><div>{trainer.reviews.map((review: any) =><blockquote key={review.id}><header><strong>{review.author.name}</strong><span>{"★".repeat(review.score)}</span><small>{review.createdAt.toLocaleDateString("fa-IR")}</small></header><p>{review.comment||"توضیح متنی ثبت نشده است."}</p></blockquote>)}</div></section></div>;
}
