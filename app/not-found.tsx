import Link from "next/link";

export default function NotFoundPage() {
  return <main className="system-state"><span>404</span><h1>Page not found</h1><p>The page may have moved, or you may not have access to this workspace.</p><div><Link href="/">Go home</Link><Link href="/dashboard">Open dashboard</Link></div></main>;
}
