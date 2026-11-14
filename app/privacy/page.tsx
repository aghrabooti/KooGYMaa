import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export const metadata: Metadata = { title: "سیاست حفظ حریم خصوصی", description: "نحوه نگهداری دادهها در کوجیما" };

export default async function PrivacyPage() {
  const t = createT(await getLocale());
  return (
    <main className="container public-page">
      <PublicNav />
      <h1>{t("public.privacyTitle")}</h1>
      <section><h2>{t("public.privacy1Title")}</h2><p>{t("public.privacy1Body")}</p></section>
      <section><h2>{t("public.privacy2Title")}</h2><p>{t("public.privacy2Body")}</p></section>
      <section><h2>{t("public.privacy3Title")}</h2><p>{t("public.privacy3Body")}</p></section>
    </main>
  );
}
