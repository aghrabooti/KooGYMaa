import Link from "next/link";
import { Brand } from "@/components/brand";
import { GymCreateForm } from "@/components/admin/gym-create-form";
import { Icon } from "@/components/icon";
import { LogoutButton } from "@/components/logout-button";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { faStatus } from "@/components/fa";
import { faCountry } from "@/components/fa";

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
          <div><span>فضاهای کاری مدیریت</span><h1>باشگاه‌های شما</h1><p>یک فضای کاری انتخاب کنید یا باشگاه تازه‌ای برای مدیریت بسازید.</p></div>
          <GymCreateForm />
        </div>

        {workspaces.length === 0 ? (
          <div className="workspace-empty">
            <span><Icon name="building" size={30} /></span>
            <h2>نخستین فضای باشگاه‌تان را بسازید</h2>
            <p>یک باشگاه بسازید تا مدیریت اعضا، مربی‌ها، طرح‌ها و اشتراک‌ها را آغاز کنید.</p>
          </div>
        ) : (
          <div className="workspace-grid">
            {workspaces.map(({ gym, role }: any) => (
              <Link className="workspace-card" href={`/admin/gyms/${gym.id}`} key={gym.id}>
                <div className="workspace-card__top">
                  <span><Icon name="building" size={23} /></span>
                  <small>{faStatus(role)}</small>
                </div>
                <h2>{gym.name}</h2>
                <p><Icon name="location" size={13} /> {gym.city || "مکان ثبت نشده"}, {faCountry(gym.country)}</p>
                <div className="workspace-card__stats">
                  <span><strong>{gym._count.memberships}</strong> عضو</span>
                  <span><strong>{gym._count.trainers}</strong> مربی</span>
                  <span><strong>{gym._count.subscriptions}</strong> اشتراک</span>
                </div>
                <div className="workspace-card__footer"><span className={`admin-status admin-status--${gym.status.toLowerCase()}`}>{faStatus(gym.status)}</span><span>باز کردن فضای کاری <Icon name="arrow" size={15} /></span></div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
