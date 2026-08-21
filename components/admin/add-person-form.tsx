"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

type AddPersonFormProps = {
  endpoint: string;
  kind: "member" | "trainer";
};

export function AddPersonForm({ endpoint, kind }: AddPersonFormProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || `Unable to add ${kind}.`);
        return;
      }
      event.currentTarget.reset();
      setOpen(false);
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return <button className="admin-primary-button" onClick={() => setOpen(true)} type="button"><Icon name="plus" size={16} /> Add {kind}</button>;
  }

  return (
    <form className="admin-inline-form" onSubmit={submit}>
      <label><span>{kind === "member" ? "Member" : "Trainer"} account email</span><input autoFocus name="email" placeholder={`${kind}@example.com`} required type="email" /></label>
      <button className="admin-primary-button" disabled={pending} type="submit">{pending ? "Adding…" : "Add"}</button>
      <button className="admin-secondary-button" onClick={() => setOpen(false)} type="button">Cancel</button>
      {error && <small role="alert">{error}</small>}
    </form>
  );
}
