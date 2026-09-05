"use client";

import { useEffect, useState } from "react";

// Item 12: configurable reminders (یادآوری‌های قابل‌تنظیم).
type Prefs = { sessionReminderHours: number; expiryReminderDays: number; inactivityNudgeDays: number; enabled: boolean };

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/user/notifications/settings").then(async (r) => { if (r.ok) setPrefs((await r.json()).prefs); });
  }, []);

  async function save() {
    if (!prefs) return;
    setMessage("");
    const res = await fetch("/api/user/notifications/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prefs) });
    const data = await res.json();
    if (res.ok) { setPrefs(data.prefs); setMessage("تنظیمات یادآوری ذخیره شد ✓"); }
    else setMessage(data.error || "خطا در ذخیره.");
  }

  if (!prefs) return null;
  return (
    <section className="member-panel" aria-label="تنظیمات یادآوری">
      <div className="member-panel__heading"><div><h2>تنظیمات یادآوری</h2><p>چه چیزی، چه زمانی به شما یادآوری شود</p></div></div>
      <label className="trainer-check"><input type="checkbox" checked={prefs.enabled} onChange={(e) => setPrefs({ ...prefs, enabled: e.target.checked })} /><span>یادآوری‌ها فعال باشند</span></label>
      <div className="reminder-grid">
        <label><span>یادآوری جلسه (ساعت قبل)</span><input type="number" min={1} max={72} value={prefs.sessionReminderHours} onChange={(e) => setPrefs({ ...prefs, sessionReminderHours: Number(e.target.value) })} /></label>
        <label><span>یادآوری پایان اشتراک (روز قبل)</span><input type="number" min={1} max={30} value={prefs.expiryReminderDays} onChange={(e) => setPrefs({ ...prefs, expiryReminderDays: Number(e.target.value) })} /></label>
        <label><span>تلنگر کم‌تحرکی (روز)</span><input type="number" min={1} max={30} value={prefs.inactivityNudgeDays} onChange={(e) => setPrefs({ ...prefs, inactivityNudgeDays: Number(e.target.value) })} /></label>
      </div>
      <button className="member-secondary-button" onClick={save}>ذخیره تنظیمات</button>
      {message && <p className="member-empty-line">{message}</p>}
    </section>
  );
}
