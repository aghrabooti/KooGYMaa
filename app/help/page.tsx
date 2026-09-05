import Link from "next/link";
import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export const metadata: Metadata = { title: "Help center", description: "How to use KooGYMaa as a member, trainer or gym admin." };

const QA = [
  ["How do I join a gym?", "Browse /gyms, open a gym, and request membership. The gym admin approves it, then you can buy a subscription."],
  ["How do subscriptions renew?", "Enable auto-renew on /user/subscriptions, or renew manually before expiry. You receive a reminder 3 days ahead."],
  ["How do I get a workout plan?", "Connect with a trainer (/user/trainers). Your trainer builds and assigns a plan; you log each session from /user/workouts."],
  ["I forgot my password. What now?", "Use /forgot-password to get a recovery link, valid for one hour."],
  ["Are my progress photos private?", "Yes — only you, your active trainer, and your gym admin can open them."],
];

export default async function HelpPage() {
  const t = createT(await getLocale());
  return (
    <main className="container public-page">
      <nav className="public-nav"><Brand /><Link href="/">← KooGYMaa</Link></nav>
      <h1>{t("public.helpTitle")}</h1>
      {QA.map(([q, a]) => <section key={q}><h2>{q}</h2><p>{a}</p></section>)}
    </main>
  );
}
