import { PlanManager } from "@/components/admin/plan-manager";
import { requireGymAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ gymId: string }> };

export default async function PlansPage({ params }: PageProps) {
  const { gymId } = await params;
  await requireGymAdminAccess(gymId);
  const plans = await prisma.subscriptionPlan.findMany({
    where: { gymId },
    select: {
      id: true,
      name: true,
      description: true,
      audience: true,
      price: true,
      currency: true,
      durationDays: true,
      isActive: true,
      _count: { select: { subscriptions: true } },
    },
    orderBy: [{ isActive: "desc" }, { audience: "asc" }, { price: "asc" }],
  });

  return (
    <div className="admin-page">
      <header className="admin-page__heading admin-page__heading--compact">
        <div><span>PRICING & ACCESS</span><h1>Subscription plans</h1><p>Create flexible plans for gym members and trainers.</p></div>
      </header>
      <PlanManager gymId={gymId} plans={plans.map(({ _count, ...plan }) => ({ ...plan, subscriptionCount: _count.subscriptions }))} />
    </div>
  );
}
