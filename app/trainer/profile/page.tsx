import { TrainerProfileForm } from "@/components/trainer/profile-form";
import { ChangePasswordPanel, SessionsPanel, VerifyEmailPanel } from "@/components/account/account-panels";
import { Icon } from "@/components/icon";
import { requireTrainerAccess } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";

export default async function TrainerProfilePage() {
  const access = await requireTrainerAccess();
  const profile = await prisma.trainerProfile.findUniqueOrThrow({
    where: { id: access.profile.id },
    select: { bio: true, specialty: true, experienceYears: true, hourlyRate: true, currency: true, isAvailable: true, user: { select: { name: true, email: true } }, _count: { select: { clients: { where: { status: "ACTIVE" } }, gyms: { where: { status: "ACTIVE" } }, reviews: true } } },
  });

  return <div className="trainer-page"><header className="trainer-page__heading trainer-page__heading--compact"><div><span>حضور شما</span><h1>پروفایل مربی</h1><p>تعیین کنید باشگاه‌ها و اعضا چگونه خدمات مربی‌گری شما را پیدا کنند.</p></div></header><section className="trainer-profile-hero"><div className="trainer-profile-avatar">{profile.user.name.slice(0, 2).toUpperCase()}</div><div><small>پروفایل عمومی</small><h2>{profile.user.name}</h2><p>{profile.user.email} · {profile.specialty || "تخصص ثبت نشده است"}</p></div><div><span><strong>{profile._count.clients}</strong> شاگردان</span><span><strong>{profile._count.gyms}</strong> باشگاه‌ها</span><span><strong>{profile._count.reviews}</strong> دیدگاه‌ها</span></div><i className={profile.isAvailable ? "is-online" : ""}><Icon name="check" size={13} /> {profile.isAvailable ? "در دسترس" : "در دسترس نیست"}</i></section><TrainerProfileForm profile={profile} /><div className="account-grid"><ChangePasswordPanel /><VerifyEmailPanel /><SessionsPanel /></div></div>;
}
