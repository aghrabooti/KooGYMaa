import Link from "next/link";
import { Icon } from "@/components/icon";
import { GymMembershipAction } from "@/components/user/market-actions";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type PageProps = { searchParams: Promise<{ q?: string; city?: string; maxPrice?: string; minRating?: string }> };
function money(value: number, currency: string) { try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); } catch { return `${value.toLocaleString()} ${currency}`; } }

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
  const gyms = rawGyms.map((gym) => ({ ...gym, rating: gym.reviews.length ? gym.reviews.reduce((sum, review) => sum + review.score, 0) / gym.reviews.length : 0 })).filter((gym) => gym.rating >= minRating);
  return <div className="member-page"><header className="member-page__heading"><div><span>DISCOVER</span><h1>Find your gym</h1><p>Compare communities, coaching teams, ratings, and membership plans.</p></div></header><form className="market-filters"><label><Icon name="search" size={15} /><input defaultValue={q} name="q" placeholder="Search gyms" /></label><select defaultValue={city} name="city"><option value="">All cities</option>{cityRows.map((row) => row.city && <option key={row.city} value={row.city}>{row.city}</option>)}</select><select defaultValue={filters.minRating} name="minRating"><option value="">Any rating</option><option value="4">4+ stars</option><option value="4.5">4.5+ stars</option></select><input defaultValue={filters.maxPrice} min="0" name="maxPrice" placeholder="Max plan price" type="number" /><button className="member-primary-button">Apply filters</button></form>{gyms.length ? <div className="market-gym-grid">{gyms.map((gym) => { const plan = gym.subscriptionPlans[0]; const membership = gym.memberships[0]; return <article key={gym.id}><Link className="market-card-link" href={`/user/gyms/${gym.id}`}><div className="market-gym-visual"><Icon name="building" size={30} /><span>{gym.rating ? `★ ${gym.rating.toFixed(1)}` : "New"}</span></div><div className="market-card-body"><small>{gym.city || "Location not set"}, {gym.country}</small><h2>{gym.name}</h2><p>{gym.description || "A fitness community ready to welcome new members."}</p><div className="market-card-stats"><span><strong>{gym._count.memberships}</strong> members</span><span><strong>{gym._count.trainers}</strong> trainers</span><span><strong>{gym.reviews.length}</strong> reviews</span></div>{plan && <div className="market-price"><span>From</span><strong>{money(plan.price, plan.currency)}</strong><small>/ {plan.durationDays} days</small></div>}</div></Link><div className="market-card-action"><Link href={`/user/gyms/${gym.id}`}>View gym <Icon name="arrow" size={13} /></Link><GymMembershipAction gymId={gym.id} status={membership?.status} /></div></article>; })}</div> : <div className="member-panel member-empty"><Icon name="building" size={27} /><h2>No gyms match these filters</h2><p>Try another city, rating, or price.</p></div>}</div>;
}
