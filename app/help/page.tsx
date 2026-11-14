import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export const metadata: Metadata = { title: "راهنمای استفاده", description: "راهنمای کوجیما برای اعضا، مربیها و مدیران باشگاه" };

export default async function HelpPage() {
  const t = createT(await getLocale());
  const QA = [
    ["public.helpQ1", "public.helpA1"],
    ["public.helpQ2", "public.helpA2"],
    ["public.helpQ3", "public.helpA3"],
    ["public.helpQ4", "public.helpA4"],
    ["public.helpQ5", "public.helpA5"],
    ["public.helpQ6", "public.helpA6"],
  ];
  return (
    <main className="container public-page">
      <PublicNav />
      <h1>{t("public.helpTitle")}</h1>
      {QA.map(([question, answer]) => <section key={question}><h2>{t(question)}</h2><p>{t(answer)}</p></section>)}
    </main>
  );
}
