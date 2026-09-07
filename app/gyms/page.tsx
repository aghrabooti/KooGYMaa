import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover gyms",
  description: "Browse active gyms on KooGYMaa — compare plans, trainers and verified reviews.",
};

export default async function PublicGymsPage() {
  const t = createT(await getLocale());
  let gyms: Array<{ id: string; name: string; city: string | null; description: string | null; plans: number; trainers: number; rating: number | null }> = [];
  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.gym.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, city: true, description: true, _count: { select: { subscriptionPlans: true, trainers: true } }, reviews: { select: { score: true } } },
      orderBy: { name: "asc" },
      take: 60,
    });
    gyms = rows.map((g: any) => ({
      id: g.id, name: g.name, city: g.city, description: g.description,
      plans: g._count.subscriptionPlans, trainers: g._count.trainers,
      rating: g.reviews.length ? g.reviews.reduce((s: number, r: any) => s + r.score, 0) / g.reviews.length : null,
    }));
  } catch { /* offline build — show empty state */ }
  return (
    <main className="container public-page">
      <PublicNav />
      <header><h1>{t("public.gymsTitle")}</h1><p>{t("public.gymsDesc")}</p></header>
      {gyms.length ? (
        <div className="public-grid">
          {gyms.map((g) => (
            <article key={g.id}>
              <h2>{g.name}</h2>
              <p>{g.city || t("nav.locationNotSet")}</p>
              {g.description && <p>{g.description.slice(0, 140)}</p>}
              <small>{g.plans} {t("public.plans")} · {g.trainers} {t("public.trainers")} {g.rating ? `· ★ ${g.rating.toFixed(1)}` : ""}</small>
              <Link href={`/gyms/${g.id}`}>{t("public.viewGym")}</Link>
            </article>
          ))}
        </div>
      ) : <p>{t("public.noGyms")}</p>}
    </main>
  );
}
