"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "EXPIRED" | "CANCELLED";

type StatusActionsProps = {
  endpoint: string;
  status: Status;
};

export function StatusActions({ endpoint, status }: StatusActionsProps) {
  const [pending, setPending] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  async function update(nextStatus: Status) {
    setPending(nextStatus);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "به‌روزرسانی انجام نشد.");
        return;
      }
      router.refresh();
    } catch {
      setError("اتصال برقرار نشد.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="admin-row-actions">
      {status === "PENDING" && <>
        <button className="approve" disabled={Boolean(pending)} onClick={() => update("ACTIVE")} type="button">{pending === "ACTIVE" ? "در حال تأیید…" : "تأیید"}</button>
        <button disabled={Boolean(pending)} onClick={() => update("REJECTED")} type="button">رد</button>
      </>}
      {status === "ACTIVE" && <button disabled={Boolean(pending)} onClick={() => update("SUSPENDED")} type="button">{pending ? "در حال به‌روزرسانی…" : "تعلیق"}</button>}
      {status === "SUSPENDED" && <>
        <button className="approve" disabled={Boolean(pending)} onClick={() => update("ACTIVE")} type="button">فعال‌سازی دوباره</button>
        <button disabled={Boolean(pending)} onClick={() => update("CANCELLED")} type="button">حذف</button>
      </>}
      {(status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED") && <button className="approve" disabled={Boolean(pending)} onClick={() => update("ACTIVE")} type="button">بازگردانی</button>}
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
