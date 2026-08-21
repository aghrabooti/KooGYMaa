import { TrainerProfileForm } from "@/components/trainer/profile-form";
import { Icon } from "@/components/icon";
import { requireTrainerAccess } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";

export default async function TrainerProfilePage() {
  const access = await requireTrainerAccess();
  const profile = await prisma.trainerProfile.findUniqueOrThrow({
    where: { id: access.profile.id },
    select: { bio: true, specialty: true, experienceYears: true, hourlyRate: true, currency: true, isAvailable: true, user: { select: { name: true, email: true } }, _count: { select: { clients: { where: { status: "ACTIVE" } }, gyms: { where: { status: "ACTIVE" } }, reviews: true } } },
  });

  return <div className="trainer-page"><header className="trainer-page__heading trainer-page__heading--compact"><div><span>YOUR PRESENCE</span><h1>Trainer profile</h1><p>Shape how gyms and members discover your coaching services.</p></div></header><section className="trainer-profile-hero"><div className="trainer-profile-avatar">{profile.user.name.slice(0, 2).toUpperCase()}</div><div><small>PUBLIC PROFILE</small><h2>{profile.user.name}</h2><p>{profile.user.email} · {profile.specialty || "Specialty not set"}</p></div><div><span><strong>{profile._count.clients}</strong> students</span><span><strong>{profile._count.gyms}</strong> gyms</span><span><strong>{profile._count.reviews}</strong> reviews</span></div><i className={profile.isAvailable ? "is-online" : ""}><Icon name="check" size={13} /> {profile.isAvailable ? "Available" : "Unavailable"}</i></section><TrainerProfileForm profile={profile} /></div>;
}
