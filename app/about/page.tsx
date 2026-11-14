import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export const metadata: Metadata = { title: "درباره کوجیما", description: "یک سکو برای باشگاهها، مربیها و اعضا" };

export default async function AboutPage() {
  const t = createT(await getLocale());
  return (
    <main className="container public-page">
      <PublicNav />
      <h1>{t("public.aboutTitle")}</h1>
      <p>{t("public.about1")}</p>
      <p>{t("public.about2")}</p>
      <p><Link href="/gyms">{t("footer.gyms")}</Link> · <Link href="/trainers">{t("footer.trainers")}</Link> · <Link href="/contact">{t("footer.contact")}</Link></p>
    </main>
  );
}
