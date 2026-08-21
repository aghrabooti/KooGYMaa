"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export type GymSettings = {
  address: string | null;
  city: string | null;
  country: string;
  description: string | null;
  email: string | null;
  id: string;
  name: string;
  phone: string | null;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
};

export function GymSettingsForm({ gym }: { gym: GymSettings }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/admin/gyms/${gym.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          slug: form.get("slug"),
          description: form.get("description"),
          email: form.get("email"),
          phone: form.get("phone"),
          address: form.get("address"),
          city: form.get("city"),
          country: form.get("country"),
          status: form.get("status"),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to update gym.");
        return;
      }
      setMessage("Gym details saved.");
      router.refresh();
    } catch {
      setError("Unable to connect.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-settings-form" onSubmit={submit}>
      <section className="admin-panel">
        <div className="admin-panel__heading"><div><h2>General information</h2><p>Shown to members and trainers browsing your gym.</p></div></div>
        <div className="admin-form-grid">
          <label><span>Gym name</span><input defaultValue={gym.name} minLength={2} name="name" required /></label>
          <label><span>URL slug</span><input defaultValue={gym.slug} name="slug" required /></label>
          <label><span>Email</span><input defaultValue={gym.email || ""} name="email" type="email" /></label>
          <label><span>Phone</span><input defaultValue={gym.phone || ""} name="phone" /></label>
          <label><span>City</span><input defaultValue={gym.city || ""} name="city" /></label>
          <label><span>Country code</span><input defaultValue={gym.country} maxLength={2} name="country" /></label>
          <label className="admin-form-grid__wide"><span>Address</span><input defaultValue={gym.address || ""} name="address" /></label>
          <label className="admin-form-grid__wide"><span>Description</span><textarea defaultValue={gym.description || ""} maxLength={1000} name="description" rows={5} /></label>
        </div>
      </section>

      <section className="admin-panel admin-visibility-panel">
        <div><h2>Gym visibility</h2><p>Suspended gyms remain accessible to staff but cannot accept new applications.</p></div>
        <select defaultValue={gym.status} name="status"><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="ARCHIVED">Archived</option></select>
      </section>

      {(error || message) && <p className={error ? "admin-form-error" : "admin-form-success"} role="status">{error || message}</p>}
      <div className="admin-settings-actions"><button className="admin-primary-button" disabled={pending} type="submit">{pending ? "Saving…" : "Save changes"}</button></div>
    </form>
  );
}
