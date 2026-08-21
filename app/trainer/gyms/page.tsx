import { GymApplicationButton } from "@/components/trainer/gym-application-button";
import { Icon } from "@/components/icon";
import { requireTrainerAccess } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function TrainerGymsPage({ searchParams }: PageProps) {
  const access = await requireTrainerAccess();
  const query = (await searchParams).q?.trim();
  const gyms = await prisma.gym.findMany({
    where: { status: "ACTIVE", ...(query ? { OR: [{ name: { contains: query } }, { city: { contains: query } }] } : {}) },
    select: { id: true, name: true, description: true, city: true, country: true, trainers: { where: { trainerId: access.profile.id }, select: { id: true, status: true, requestedAt: true, startedAt: true }, take: 1 }, _count: { select: { memberships: { where: { status: "ACTIVE" } }, trainers: { where: { status: "ACTIVE" } } } } },
    orderBy: { name: "asc" },
  });
  const active = gyms.filter((gym) => gym.trainers[0]?.status === "ACTIVE").length;
  const pending = gyms.filter((gym) => gym.trainers[0]?.status === "PENDING").length;

  return <div className="trainer-page"><header className="trainer-page__heading trainer-page__heading--compact"><div><span>COACHING NETWORK</span><h1>Gyms</h1><p>Manage your gym memberships or discover a new place to coach.</p></div><form className="trainer-search"><Icon name="search" size={16} /><input defaultValue={query} name="q" placeholder="Search gyms or cities" /><button>Search</button></form></header><section className="trainer-summary"><div><span>Active gyms</span><strong>{active}</strong></div><div><span>Pending applications</span><strong>{pending}</strong></div><div><span>Available gyms</span><strong>{gyms.length}</strong></div></section>{gyms.length ? <div className="trainer-gym-grid">{gyms.map((gym) => { const membership = gym.trainers[0]; return <article key={gym.id}><div className="trainer-gym-card__top"><span><Icon name="building" size={22} /></span>{membership && <b className={`trainer-status trainer-status--${membership.status.toLowerCase()}`}>{membership.status}</b>}</div><h2>{gym.name}</h2><p className="trainer-gym-location"><Icon name="location" size={13} /> {gym.city || "Location not set"}, {gym.country}</p><p>{gym.description || "No gym description yet."}</p><div className="trainer-gym-stats"><span><strong>{gym._count.memberships}</strong> members</span><span><strong>{gym._count.trainers}</strong> trainers</span></div><GymApplicationButton gymId={gym.id} membership={membership} /></article>; })}</div> : <div className="trainer-panel trainer-empty"><Icon name="building" size={26} /><strong>No gyms found</strong><span>Try a different search.</span></div>}</div>;
}
