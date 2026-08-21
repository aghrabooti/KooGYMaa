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
        <div><span>WORKSPACE</span><h1>Gym settings</h1><p>Keep public information, contact details, and visibility up to date.</p></div>
      </header>
      <GymSettingsForm gym={gym} />
    </div>
  );
}
