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
        setError(data.error || "Update failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to connect.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="admin-row-actions">
      {status === "PENDING" && <>
        <button className="approve" disabled={Boolean(pending)} onClick={() => update("ACTIVE")} type="button">{pending === "ACTIVE" ? "Approving…" : "Approve"}</button>
        <button disabled={Boolean(pending)} onClick={() => update("REJECTED")} type="button">Reject</button>
      </>}
      {status === "ACTIVE" && <button disabled={Boolean(pending)} onClick={() => update("SUSPENDED")} type="button">{pending ? "Updating…" : "Suspend"}</button>}
      {status === "SUSPENDED" && <>
        <button className="approve" disabled={Boolean(pending)} onClick={() => update("ACTIVE")} type="button">Reactivate</button>
        <button disabled={Boolean(pending)} onClick={() => update("CANCELLED")} type="button">Remove</button>
      </>}
      {(status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED") && <button className="approve" disabled={Boolean(pending)} onClick={() => update("ACTIVE")} type="button">Restore</button>}
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
