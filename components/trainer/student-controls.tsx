"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

export function InviteStudent({ gyms }: { gyms: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false); const [pending, setPending] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setError(""); const form = new FormData(event.currentTarget); try { const response = await fetch("/api/trainer/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), gymId: form.get("gymId") }) }); const data = await response.json(); if (!response.ok) { setError(data.error || "Unable to invite student."); return; } setOpen(false); router.refresh(); } catch { setError("Unable to connect."); } finally { setPending(false); } }
  if (!open) return <button className="trainer-primary-button" onClick={() => setOpen(true)} type="button"><Icon name="plus" size={16} /> Invite student</button>;
  return <form className="trainer-inline-form" onSubmit={submit}><label><span>Member email</span><input autoFocus name="email" placeholder="member@example.com" required type="email" /></label><label><span>Gym context</span><select name="gymId"><option value="">Independent coaching</option>{gyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</select></label><button className="trainer-primary-button" disabled={pending}>{pending ? "Inviting…" : "Send invite"}</button><button className="trainer-secondary-button" onClick={() => setOpen(false)} type="button">Cancel</button>{error && <small>{error}</small>}</form>;
}

export function StudentStatusActions({ clientId, status }: { clientId: string; status: "PENDING" | "ACTIVE" | "PAUSED" | "REJECTED" | "ENDED" }) {
  const [pending, setPending] = useState(""); const [error, setError] = useState(""); const router = useRouter();
  async function update(nextStatus: string) { setPending(nextStatus); setError(""); try { const response = await fetch(`/api/trainer/clients/${clientId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) }); const data = await response.json(); if (!response.ok) { setError(data.error || "Update failed."); return; } router.refresh(); } catch { setError("Unable to connect."); } finally { setPending(""); } }
  return <div className="trainer-row-actions">{status === "PENDING" && <><button className="approve" disabled={Boolean(pending)} onClick={() => update("ACTIVE")}>Accept</button><button disabled={Boolean(pending)} onClick={() => update("REJECTED")}>Decline</button></>}{status === "ACTIVE" && <><button disabled={Boolean(pending)} onClick={() => update("PAUSED")}>Pause</button><button disabled={Boolean(pending)} onClick={() => update("ENDED")}>End coaching</button></>}{status === "PAUSED" && <><button className="approve" disabled={Boolean(pending)} onClick={() => update("ACTIVE")}>Resume</button><button disabled={Boolean(pending)} onClick={() => update("ENDED")}>End</button></>}{(status === "REJECTED" || status === "ENDED") && <button className="approve" disabled={Boolean(pending)} onClick={() => update("ACTIVE")}>Restore</button>}{error && <small>{error}</small>}</div>;
}
