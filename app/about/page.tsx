import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export const metadata: Metadata = { title: "About KooGYMaa", description: "One platform for gyms, trainers and members." };

export default async function AboutPage() {
  const t = createT(await getLocale());
  return (
    <main className="container public-page">
      <PublicNav />
      <h1>{t("public.aboutTitle")}</h1>
      <p>KooGYMaa brings gym operations, coaching, and member progress into one simple workspace. Three roles, one system: members train, trainers coach, gym owners run the business.</p>
      <p>کوجیما عملیات باشگاه، مربی‌گری و پیشرفت اعضا را در یک فضای کاری ساده گرد هم می‌آورد.</p>
      <p><Link href="/gyms">{t("footer.gyms")}</Link> · <Link href="/trainers">{t("footer.trainers")}</Link> · <Link href="/contact">{t("footer.contact")}</Link></p>
    </main>
  );
}
