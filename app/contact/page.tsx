import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export const metadata: Metadata = { title: "تماس با ما", description: "ارتباط با تیم کوجیما" };

export default async function ContactPage() {
  const t = createT(await getLocale());
  return (
    <main className="container public-page">
      <PublicNav />
      <h1>{t("public.contactTitle")}</h1>
      <p>{t("public.contactLabel")} <a href="mailto:support@koogymaa.example" dir="ltr">support@koogymaa.example</a></p>
      <p>{t("public.contactBody")}</p>
    </main>
  );
}
