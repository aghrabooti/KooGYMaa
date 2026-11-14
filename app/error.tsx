"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/language-provider";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => { console.error(error); }, [error]);
  return <main className="system-state"><span>!</span><h1>{t("sys.errorTitle")}</h1><p>{t("sys.errorDesc")}</p><div><button onClick={reset}>{t("sys.retry")}</button><Link href="/dashboard">{t("sys.dashboard")}</Link></div>{error.digest && <small>{t("sys.reference")}: {error.digest}</small>}</main>;
}
