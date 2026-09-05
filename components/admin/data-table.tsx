"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type BulkAction = { value: string; label: string };

// Item 13: bulk operations bar — collects checked rows (input[data-bulk-id]) and
// posts { ids, status } to the given bulk endpoint.
export function BulkBar({ endpoint, actions, label }: { endpoint: string; actions: BulkAction[]; label: string }) {
  const [action, setAction] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  function collect(): string[] {
    return Array.from(document.querySelectorAll<HTMLInputElement>('input[data-bulk-id]:checked')).map((el) => el.dataset.bulkId || "").filter(Boolean);
  }

  function toggleAll(on: boolean) {
    document.querySelectorAll<HTMLInputElement>('input[data-bulk-id]').forEach((el) => { el.checked = on; });
  }

  async function run() {
    const ids = collect();
    if (!action || !ids.length) return;
    setPending(true);
    setMessage("");
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, status: action }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(data.error || "عملیات ناموفق بود."); return; }
      setMessage(`${data.updated || 0} رکورد به‌روزرسانی شد.`);
      router.refresh();
    } catch {
      setMessage("اتصال برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-bulkbar" aria-label={label}>
      <label><input type="checkbox" onChange={(e) => toggleAll(e.target.checked)} aria-label="انتخاب همه" /> همه</label>
      <select value={action} onChange={(e) => setAction(e.target.value)} aria-label="عملیات گروهی">
        <option value="">عملیات گروهی…</option>
        {actions.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>
      <button disabled={pending || !action} onClick={run}>{pending ? "…" : "اجرا"}</button>
      {message && <span className="admin-note">{message}</span>}
    </div>
  );
}

// Item 13: server-driven pagination links (?page=).
export function Pagination({ page, totalPages, base }: { page: number; totalPages: number; base: string }) {
  if (totalPages <= 1) return null;
  const link = (p: number) => `${base}${base.includes("?") ? "&" : "?"}page=${p}`;
  const nums: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) nums.push(p);
  return (
    <nav className="admin-pagination" aria-label="صفحه‌بندی">
      {page > 1 && <a href={link(page - 1)}>→ قبلی</a>}
      {nums.map((p) => <a key={p} href={link(p)} aria-current={p === page ? "page" : undefined} className={p === page ? "active" : ""}>{p}</a>)}
      {page < totalPages && <a href={link(page + 1)}>بعدی ←</a>}
      <span>از {totalPages} صفحه</span>
    </nav>
  );
}
