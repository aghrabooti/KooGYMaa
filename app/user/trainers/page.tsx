import Link from "next/link";
import { Icon } from "@/components/icon";
import { TrainerRequestAction } from "@/components/user/market-actions";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type PageProps = { searchParams: Promise<{ q?: string; specialty?: string; gym?: string; maxRate?: string; minRating?: string }> };
function money(value: number, currency: string) { try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); } catch { return `${value.toLocaleString()} ${currency}`; } }
export default async function DiscoverTrainersPage({ searchParams }: PageProps) {
  const user = await requireCurrentUser(["USER"]); const filters = await searchParams; const q = filters.q?.trim(); const maxRate = Number(filters.maxRate || 0); const minRating = Number(filters.minRating || 0);
  const [raw, specialtyRows, memberships] = await Promise.all([
    prisma.trainerProfile.findMany({
      where: {
        isAvailable: true,
        user: { status: "ACTIVE", role: "TRAINER" },
        ...(filters.specialty ? { specialty: filters.specialty } : {}),
        ...(filters.gym ? { gyms: { some: { gymId: filters.gym, status: "ACTIVE" } } } : {}),
        AND: [
          ...(q ? [{ OR: [{ specialty: { contains: q } }, { bio: { contains: q } }, { user: { name: { contains: q } } }] }] : []),
          ...(maxRate > 0 ? [{ OR: [{ hourlyRate: null }, { hourlyRate: { lte: maxRate } }] }] : []),
        ],
      },
      select: {
        id: true, bio: true, specialty: true, experienceYears: true, hourlyRate: true, currency: true,
        user: { select: { name: true } },
        reviews: { select: { score: true } },
        gyms: { where: { status: "ACTIVE" }, select: { gym: { select: { id: true, name: true, city: true } } } },
        clients: { where: { userId: user.id }, select: { status: true }, take: 1 },
        _count: { select: { clients: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.trainerProfile.findMany({ where: { specialty: { not: null }, isAvailable: true }, distinct: ["specialty"], select: { specialty: true }, orderBy: { specialty: "asc" } }),
    prisma.gymMembership.findMany({ where: { userId: user.id, status: "ACTIVE" }, select: { gym: { select: { id: true, name: true } } } }),
  ]);
  const trainers = raw.map((trainer) => ({ ...trainer, rating: trainer.reviews.length ? trainer.reviews.reduce((sum, review) => sum + review.score, 0) / trainer.reviews.length : 0 })).filter((trainer) => trainer.rating >= minRating);
  return <div className="member-page"><header className="member-page__heading"><div><span>COACHING</span><h1>Find your trainer</h1><p>Compare expertise, experience, rates, ratings, and gym availability.</p></div></header><form className="market-filters market-filters--trainers"><label><Icon name="search" size={15} /><input defaultValue={q} name="q" placeholder="Search trainers" /></label><select defaultValue={filters.specialty} name="specialty"><option value="">All specialties</option>{specialtyRows.map((row) => row.specialty && <option key={row.specialty} value={row.specialty}>{row.specialty}</option>)}</select><select defaultValue={filters.gym} name="gym"><option value="">Any gym</option>{memberships.map(({ gym }) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</select><select defaultValue={filters.minRating} name="minRating"><option value="">Any rating</option><option value="4">4+ stars</option><option value="4.5">4.5+ stars</option></select><input defaultValue={filters.maxRate} min="0" name="maxRate" placeholder="Max hourly rate" type="number" /><button className="member-primary-button">Apply</button></form>{trainers.length ? <div className="market-trainer-grid">{trainers.map((trainer) => { const relationship = trainer.clients[0]; const sharedGyms = trainer.gyms.map((item) => item.gym).filter((gym) => memberships.some((membership) => membership.gym.id === gym.id)); return <article key={trainer.id}><Link href={`/user/trainers/${trainer.id}`}><div className="market-trainer-avatar">{trainer.user.name.slice(0,2).toUpperCase()}<i /></div><small>{trainer.specialty || "General fitness"}</small><h2>{trainer.user.name}</h2><p>{trainer.bio || "Personal coaching focused on sustainable progress."}</p><div className="market-trainer-meta"><span><Icon name="clock" size={13} /> {trainer.experienceYears || 0} years</span><span>★ {trainer.rating ? trainer.rating.toFixed(1) : "New"}</span><span><Icon name="users" size={13} /> {trainer._count.clients} clients</span></div>{trainer.hourlyRate !== null && <div className="market-trainer-rate"><strong>{money(trainer.hourlyRate, trainer.currency)}</strong><span>/ hour</span></div>}<div className="market-trainer-gyms">{trainer.gyms.slice(0,2).map(({ gym }) => <span key={gym.id}>{gym.name}</span>)}</div></Link><div className="market-card-action"><Link href={`/user/trainers/${trainer.id}`}>View profile</Link><TrainerRequestAction gyms={sharedGyms} trainerId={trainer.id} status={relationship?.status} /></div></article>; })}</div> : <div className="member-panel member-empty"><Icon name="users" size={27} /><h2>No trainers match</h2><p>Try adjusting your specialty, gym, rating, or price filters.</p></div>}</div>;
}
