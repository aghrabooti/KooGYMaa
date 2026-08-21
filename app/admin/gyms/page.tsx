import Link from "next/link";
import { Brand } from "@/components/brand";
import { GymCreateForm } from "@/components/admin/gym-create-form";
import { Icon } from "@/components/icon";
import { LogoutButton } from "@/components/logout-button";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AdminGymsPage() {
  const user = await requireCurrentUser(["ADMIN"]);
  const workspaces = await prisma.gymStaff.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    select: {
      role: true,
      gym: {
        select: {
          id: true,
          name: true,
          city: true,
          country: true,
          status: true,
          _count: {
            select: {
              memberships: { where: { status: "ACTIVE" } },
              trainers: { where: { status: "ACTIVE" } },
              subscriptions: { where: { status: "ACTIVE" } },
            },
          },
        },
      },
    },
    orderBy: { gym: { createdAt: "desc" } },
  });

  return (
    <main className="workspace-page">
      <header className="workspace-page__header">
        <Brand />
        <div><span>{user.name}</span><LogoutButton /></div>
      </header>
      <section className="workspace-page__content">
        <div className="workspace-heading">
          <div><span>ADMIN WORKSPACES</span><h1>Your gyms</h1><p>Choose a workspace or create a new gym to manage.</p></div>
          <GymCreateForm />
        </div>

        {workspaces.length === 0 ? (
          <div className="workspace-empty">
            <span><Icon name="building" size={30} /></span>
            <h2>Build your first gym workspace</h2>
            <p>Create a gym to start managing members, trainers, plans, and subscriptions.</p>
          </div>
        ) : (
          <div className="workspace-grid">
            {workspaces.map(({ gym, role }) => (
              <Link className="workspace-card" href={`/admin/gyms/${gym.id}`} key={gym.id}>
                <div className="workspace-card__top">
                  <span><Icon name="building" size={23} /></span>
                  <small>{role}</small>
                </div>
                <h2>{gym.name}</h2>
                <p><Icon name="location" size={13} /> {gym.city || "Location not set"}, {gym.country}</p>
                <div className="workspace-card__stats">
                  <span><strong>{gym._count.memberships}</strong> members</span>
                  <span><strong>{gym._count.trainers}</strong> trainers</span>
                  <span><strong>{gym._count.subscriptions}</strong> subscriptions</span>
                </div>
                <div className="workspace-card__footer"><span className={`admin-status admin-status--${gym.status.toLowerCase()}`}>{gym.status}</span><span>Open workspace <Icon name="arrow" size={15} /></span></div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
