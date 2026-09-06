import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/public-nav";
import { FaDate, Money } from "@/components/fa";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ gymId: string }> }): Promise<Metadata> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const gym = await prisma.gym.findUnique({ where: { id: (await params).gymId }, select: { name: true, description: true } });
    if (gym) return { title: gym.name, description: gym.description?.slice(0, 160) || `Train at ${gym.name} with KooGYMaa.` };
  } catch { /* ignore */ }
  return { title: "Gym" };
}

export default async function PublicGymPage({ params }: { params: Promise<{ gymId: string }> }) {
  const t = createT(await getLocale());
  const { gymId } = await params;
  let gym: any = null;
  try {
    const { prisma } = await import("@/lib/prisma");
    gym = await prisma.gym.findFirst({
      where: { id: gymId, status: "ACTIVE" },
      select: {
        id: true, name: true, city: true, description: true, address: true, phone: true, email: true, createdAt: true,
        subscriptionPlans: { where: { isActive: true, audience: "MEMBER" }, select: { id: true, name: true, price: true, currency: true, durationDays: true } },
        trainers: { where: { status: "ACTIVE" }, select: { trainer: { select: { id: true, specialty: true, user: { select: { name: true } } } } }, take: 12 },
        reviews: { select: { score: true, comment: true, createdAt: true, author: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
  } catch { /* ignore */ }
  if (!gym) notFound();
  const rating = gym.reviews.length ? gym.reviews.reduce((s: number, r: any) => s + r.score, 0) / gym.reviews.length : null;
  return (
    <main className="container public-page">
      <PublicNav backHref="/gyms" backLabel={t("public.gymsTitle")} />
      <header><h1>{gym.name}</h1><p>{gym.city || ""} {rating ? `· ★ ${rating.toFixed(1)} (${gym.reviews.length} ${t("public.reviews")})` : ""}</p>{gym.description && <p>{gym.description}</p>}</header>
      <section><h2>{t("public.plans")}</h2><div className="public-grid">{gym.subscriptionPlans.map((p: any) => <article key={p.id}><h3>{p.name}</h3><p><Money amount={p.price} currency={p.currency} /> · {p.durationDays} days</p></article>)}</div></section>
      <section><h2>{t("public.trainers")}</h2><div className="public-grid">{gym.trainers.map((x: any) => <article key={x.trainer.id}><h3>{x.trainer.user.name}</h3><p>{x.trainer.specialty || ""}</p></article>)}</div></section>
      <section><h2>{t("public.reviews")}</h2>{gym.reviews.map((r: any) => <blockquote key={r.score + r.createdAt}>★ {r.score} — {r.comment}<footer>{r.author.name} · <FaDate value={r.createdAt} /></footer></blockquote>)}</section>
      <p><Link className="button button--lime" href="/register">{t("public.requestMembership")}</Link></p>
    </main>
  );
}
