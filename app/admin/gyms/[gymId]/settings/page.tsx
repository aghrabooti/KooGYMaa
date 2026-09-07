import { GymSettingsForm } from "@/components/admin/gym-settings-form";
import { requireGymAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ gymId: string }> };

export default async function GymSettingsPage({ params }: PageProps) {
  const { gymId } = await params;
  await requireGymAdminAccess(gymId);
  const gym = await prisma.gym.findUniqueOrThrow({
    where: { id: gymId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      country: true,
      status: true,
    },
  });

  return (
    <div className="admin-page">
      <header className="admin-page__heading admin-page__heading--compact">
        <div><span>فضای کاری</span><h1>تنظیمات باشگاه</h1><p>اطلاعات عمومی، راه‌های تماس و نمایش را به‌روز نگه دارید.</p></div>
      </header>
      <GymSettingsForm gym={gym} />
    </div>
  );
}
