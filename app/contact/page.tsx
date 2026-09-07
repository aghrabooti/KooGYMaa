import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export const metadata: Metadata = { title: "Contact us", description: "Get in touch with the KooGYMaa team." };

export default async function ContactPage() {
  const t = createT(await getLocale());
  return (
    <main className="container public-page">
      <PublicNav />
      <h1>{t("public.contactTitle")}</h1>
      <p>Email: <a href="mailto:support@koogymaa.example" dir="ltr">support@koogymaa.example</a></p>
      <p>پشتیبانی از طریق ایمیل پاسخ‌گوی شماست. برای گزارش مشکل، شناسه باشگاه و شرح خطا را ذکر کنید.</p>
    </main>
  );
}
