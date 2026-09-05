"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

// Item 9: real photo upload (private storage behind auth).
export function PhotoUpload({ measurementId }: { measurementId?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [pose, setPose] = useState("Front");
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function send(file: File) {
    setPending(true);
    setError("");
    try {
      const form = new FormData();
      form.set("photo", file);
      form.set("pose", pose);
      if (measurementId) form.set("measurementId", measurementId);
      const res = await fetch("/api/user/progress-photos/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "آپلود ناموفق بود."); return; }
      router.refresh();
    } catch {
      setError("اتصال برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="photo-upload">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) send(f); e.target.value = ""; }} />
      <select value={pose} onChange={(e) => setPose(e.target.value)} aria-label="ژست عکس">
        <option value="Front">روبه‌رو</option>
        <option value="Side">نیم‌رخ</option>
        <option value="Back">پشت</option>
      </select>
      <button type="button" className="member-secondary-button" disabled={pending} onClick={() => input.current?.click()}>
        <Icon name="plus" size={14} /> {pending ? "در حال آپلود…" : "آپلود عکس پیشرفت"}
      </button>
      {error && <p className="member-form-error">{error}</p>}
    </div>
  );
}
