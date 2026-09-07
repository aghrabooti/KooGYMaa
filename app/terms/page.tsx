import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export const metadata: Metadata = { title: "Terms of service", description: "KooGYMaa terms of service." };

export default async function TermsPage() {
  const t = createT(await getLocale());
  return (
    <main className="container public-page">
      <PublicNav />
      <h1>{t("public.termsTitle")}</h1>
      <section><h2>1. Service</h2><p>KooGYMaa provides gym management, coaching and progress-tracking tools. Accounts must be used by their owners; suspended users lose access.</p></section>
      <section><h2>2. Payments & refunds</h2><p>Payments are recorded per transaction. Successful payments activate access; refunded payments cancel the related subscription. Renewals extend from the current end date.</p></section>
      <section><h2>3. Content</h2><p>Training content is educational and not medical advice. Train within your capacity and consult a professional when in doubt.</p></section>
    </main>
  );
}
