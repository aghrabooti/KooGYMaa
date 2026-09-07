import Link from "next/link";
import { Icon } from "@/components/icon";
import { GymMembershipAction } from "@/components/user/market-actions";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { toFaDigits } from "@/lib/fa";
import { faCountry } from "@/components/fa";

type PageProps = { searchParams: Promise<{ q?: string; city?: string; maxPrice?: string; minRating?: string }> };
function money(value: number, currency: string) { try { return new Intl.NumberFormat("fa-IR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); } catch { return `${value.toLocaleString("fa-IR")} ${currency}`; } }

export default async function DiscoverGymsPage({ searchParams }: PageProps) {
  const user = await requireCurrentUser(["USER"]); const filters = await searchParams; const q = filters.q?.trim(); const city = filters.city?.trim(); const maxPrice = Number(filters.maxPrice || 0); const minRating = Number(filters.minRating || 0);
  const [rawGyms, cityRows] = await Promise.all([
    prisma.gym.findMany({
      where: {
        status: "ACTIVE",
        ...(q ? { OR: [{ name: { contains: q } }, { description: { contains: q } }, { city: { contains: q } }] } : {}),
        ...(city ? { city } : {}),
        ...(maxPrice > 0 ? { subscriptionPlans: { some: { audience: "MEMBER", isActive: true, price: { lte: maxPrice } } } } : {}),
      },
      select: {
        id: true, name: true, slug: true, description: true, city: true, country: true, address: true,
        subscriptionPlans: { where: { audience: "MEMBER", isActive: true }, select: { price: true, currency: true, durationDays: true }, orderBy: { price: "asc" }, take: 1 },
        reviews: { select: { score: true } },
        memberships: { where: { userId: user.id }, select: { status: true }, take: 1 },
        _count: { select: { memberships: { where: { status: "ACTIVE" } }, trainers: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.gym.findMany({ where: { status: "ACTIVE", city: { not: null } }, distinct: ["city"], select: { city: true }, orderBy: { city: "asc" } }),
  ]);
  const gyms = rawGyms.map((gym: any) => ({ ...gym, rating: gym.reviews.length ? gym.reviews.reduce((sum: any, review: any) => sum + review.score, 0) / gym.reviews.length : 0 })).filter((gym: any) => gym.rating >= minRating);
  return <div className="member-page"><header className="member-page__heading"><div><span>کشف</span><h1>باشگاه‌تان را پیدا کنید</h1><p>جامعه‌ها، تیم‌های مربی‌گری، امتیازها و طرح‌های عضویت را مقایسه کنید.</p></div></header><form className="market-filters"><label><Icon name="search" size={15} /><input defaultValue={q} name="q" placeholder="جستجوی باشگاه‌ها" /></label><select defaultValue={city} name="city"><option value="">همه شهرها</option>{cityRows.map((row: any) => row.city && <option key={row.city} value={row.city}>{row.city}</option>)}</select><select defaultValue={filters.minRating} name="minRating"><option value="">هر امتیازی</option><option value="4">۴ ستاره به بالا</option><option value="4.5">۴٫۵ ستاره به بالا</option></select><input defaultValue={filters.maxPrice} min="0" name="maxPrice" placeholder="سقف قیمت طرح" type="number" /><button className="member-primary-button">اعمال فیلتر</button></form>{gyms.length ? <div className="market-gym-grid">{gyms.map((gym: any) => { const plan = gym.subscriptionPlans[0]; const membership = gym.memberships[0]; return <article key={gym.id}><Link className="market-card-link" href={`/user/gyms/${gym.id}`}><div className="market-gym-visual"><Icon name="building" size={30} /><span>{gym.rating ? `★ ${toFaDigits(gym.rating.toFixed(1))}` : "جدید"}</span></div><div className="market-card-body"><small>{gym.city || "مکان ثبت نشده"}, {faCountry(gym.country)}</small><h2>{gym.name}</h2><p>{gym.description || "یک جامعه ورزشی آماده پذیرش اعضای تازه."}</p><div className="market-card-stats"><span><strong>{gym._count.memberships}</strong> عضو</span><span><strong>{gym._count.trainers}</strong> مربی</span><span><strong>{gym.reviews.length}</strong> دیدگاه‌ها</span></div>{plan && <div className="market-price"><span>از</span><strong>{money(plan.price, plan.currency)}</strong><small>/ {plan.durationDays} روز</small></div>}</div></Link><div className="market-card-action"><Link href={`/user/gyms/${gym.id}`}>مشاهده باشگاه <Icon name="arrow" size={13} /></Link><GymMembershipAction gymId={gym.id} status={membership?.status} /></div></article>; })}</div> : <div className="member-panel member-empty"><Icon name="building" size={27} /><h2>باشگاهی با این فیلترها هم‌خوان نیست</h2><p>شهر، امتیاز یا قیمت دیگری امتحان کنید.</p></div>}</div>;
}
