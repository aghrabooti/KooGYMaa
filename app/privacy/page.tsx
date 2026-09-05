import Link from "next/link";
import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export const metadata: Metadata = { title: "Privacy policy", description: "How KooGYMaa handles your data." };

export default async function PrivacyPage() {
  const t = createT(await getLocale());
  return (
    <main className="container public-page">
      <nav className="public-nav"><Brand /><Link href="/">← KooGYMaa</Link></nav>
      <h1>{t("public.privacyTitle")}</h1>
      <section><h2>Data we store</h2><p>Account details, memberships, training and payment records needed to run the service. Money values are stored as integers in the smallest currency unit.</p></section>
      <section><h2>Progress photos</h2><p>Photos are stored privately and visible only to you, your active trainer, and your gym admin. You can delete them at any time.</p></section>
      <section><h2>Sessions & security</h2><p>Sessions are signed HttpOnly cookies. You can review and revoke active sessions from your profile. Sensitive admin actions are audit-logged.</p></section>
    </main>
  );
}
