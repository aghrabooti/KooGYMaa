"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

export function GymCreateForm() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          city: form.get("city"),
          country: form.get("country"),
          email: form.get("email"),
          phone: form.get("phone"),
          status: "ACTIVE",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to create the gym.");
        return;
      }

      router.push(`/admin/gyms/${data.gym.id}`);
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button className="admin-primary-button" onClick={() => setOpen(true)} type="button">
        <Icon name="plus" size={17} /> Add a gym
      </button>
    );
  }

  return (
    <form className="admin-create-form" onSubmit={handleSubmit}>
      <div className="admin-create-form__heading">
        <div><strong>Create a gym workspace</strong><span>You&apos;ll be added as its owner.</span></div>
        <button aria-label="Close form" onClick={() => setOpen(false)} type="button">×</button>
      </div>
      {error && <p className="admin-form-error" role="alert">{error}</p>}
      <div className="admin-form-grid">
        <label><span>Gym name</span><input name="name" placeholder="KooGYMaa Central" required minLength={2} /></label>
        <label><span>City</span><input name="city" placeholder="Tehran" /></label>
        <label><span>Country code</span><input defaultValue="IR" maxLength={2} name="country" /></label>
        <label><span>Contact email</span><input name="email" placeholder="hello@gym.com" type="email" /></label>
        <label><span>Phone</span><input name="phone" placeholder="+98 ..." /></label>
      </div>
      <div className="admin-form-actions">
        <button className="admin-secondary-button" onClick={() => setOpen(false)} type="button">Cancel</button>
        <button className="admin-primary-button" disabled={pending} type="submit">
          {pending ? "Creating…" : "Create workspace"}
        </button>
      </div>
    </form>
  );
}
