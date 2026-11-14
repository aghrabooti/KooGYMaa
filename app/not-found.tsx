import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

export default async function NotFoundPage() {
  const t = createT(await getLocale());
  return <main className="system-state"><span>۴۰۴</span><h1>{t("sys.notFoundTitle")}</h1><p>{t("sys.notFoundDesc")}</p><div><Link href="/">{t("sys.home")}</Link><Link href="/dashboard">{t("sys.dashboard")}</Link></div></main>;
}
