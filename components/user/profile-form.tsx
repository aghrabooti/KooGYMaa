"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function MemberProfileForm({ user }: { user: { name: string; email: string; phone: string | null; avatarUrl: string | null } }) {
  const [pending, setPending] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setMessage(""); setError(""); const form = new FormData(event.currentTarget); try { const response = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), phone: form.get("phone"), avatarUrl: form.get("avatarUrl") }) }); const data = await response.json(); if (!response.ok) { setError(data.error || "Unable to save profile."); return; } setMessage("Profile saved."); router.refresh(); } finally { setPending(false); } }
  return <form className="member-profile-form" onSubmit={submit}><div className="member-profile-avatar">{user.name.slice(0,2).toUpperCase()}</div><div><label><span>Full name</span><input defaultValue={user.name} name="name" required /></label><label><span>Email</span><input disabled value={user.email} /></label><label><span>Phone</span><input defaultValue={user.phone || ""} name="phone" /></label><label className="member-form-wide"><span>Avatar URL</span><input defaultValue={user.avatarUrl || ""} name="avatarUrl" type="url" /></label></div>{(message || error) && <p className={error ? "member-form-error" : "member-form-success"}>{error || message}</p>}<footer><button className="member-primary-button" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button></footer></form>;
}
