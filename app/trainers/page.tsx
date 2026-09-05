import Link from "next/link";
import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meet the trainers",
  description: "Available trainers on KooGYMaa — specialties, experience, transparent pricing and verified reviews.",
};

export default async function PublicTrainersPage() {
  const t = createT(await getLocale());
  let trainers: any[] = [];
  try {
    const { prisma } = await import("@/lib/prisma");
    trainers = await prisma.trainerProfile.findMany({
      where: { isAvailable: true, user: { status: "ACTIVE" } },
      select: { id: true, specialty: true, experienceYears: true, hourlyRate: true, currency: true, bio: true, user: { select: { name: true } }, reviews: { select: { score: true } } },
      orderBy: { updatedAt: "desc" },
      take: 60,
    });
  } catch { /* ignore */ }
  return (
    <main className="container public-page">
      <nav className="public-nav"><Brand /><Link href="/">← KooGYMaa</Link></nav>
      <header><h1>{t("public.trainersTitle")}</h1><p>{t("public.trainersDesc")}</p></header>
      {trainers.length ? (
        <div className="public-grid">
          {trainers.map((tr: any) => {
            const rating = tr.reviews.length ? tr.reviews.reduce((s: number, r: any) => s + r.score, 0) / tr.reviews.length : null;
            return (
              <article key={tr.id}>
                <h2>{tr.user.name}</h2>
                <p>{tr.specialty || ""}{tr.experienceYears ? ` · ${tr.experienceYears}y` : ""}</p>
                {tr.bio && <p>{tr.bio.slice(0, 140)}</p>}
                <small>{rating ? `★ ${rating.toFixed(1)} · ` : ""}{tr.hourlyRate !== null && tr.hourlyRate !== undefined ? `${tr.hourlyRate} ${tr.currency}/h` : ""}</small>
              </article>
            );
          })}
        </div>
      ) : <p>{t("public.noTrainers")}</p>}
    </main>
  );
}
