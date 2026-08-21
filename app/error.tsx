"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="system-state"><span>!</span><h1>Something went wrong</h1><p>We couldn&apos;t complete that request. Your data is safe—try again or return to your dashboard.</p><div><button onClick={reset}>Try again</button><Link href="/dashboard">Go to dashboard</Link></div>{error.digest&&<small>Reference: {error.digest}</small>}</main>;
}
