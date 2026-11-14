import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export const metadata: Metadata = { title: "شرایط استفاده", description: "شرایط استفاده از کوجیما" };

export default async function TermsPage() {
  const t = createT(await getLocale());
  return (
    <main className="container public-page">
      <PublicNav />
      <h1>{t("public.termsTitle")}</h1>
      <section><h2>{t("public.terms1Title")}</h2><p>{t("public.terms1Body")}</p></section>
      <section><h2>{t("public.terms2Title")}</h2><p>{t("public.terms2Body")}</p></section>
      <section><h2>{t("public.terms3Title")}</h2><p>{t("public.terms3Body")}</p></section>
    </main>
  );
}
