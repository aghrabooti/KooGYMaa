"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import kashaniWorkout from "@/lib/kashani-workout.json";

export function ImportWorkoutButton() {
  const router = useRouter();
  const importing = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function importWorkout() {
    if (importing.current) return;
    importing.current = true;
    setPending(true);
    setError("");
    let created = false;

    try {
      const response = await fetch("/api/trainer/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kashaniWorkout),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || typeof result?.plan?.id !== "string") {
        setError(result?.error || "برنامه وارد نشد. دوباره تلاش کنید.");
        return;
      }

      created = true;
      router.push(`/trainer/workouts/${encodeURIComponent(result.plan.id)}`);
    } catch {
      setError("ارتباط برقرار نشد. دوباره تلاش کنید.");
    } finally {
      if (!created) {
        importing.current = false;
        setPending(false);
      }
    }
  }

  return (
    <div>
      <button className="trainer-secondary-button" disabled={pending} onClick={importWorkout} type="button">
        <Icon name="clipboard" size={16} />
        {pending ? "در حال وارد کردن برنامه…" : "وارد کردن برنامهٔ چهارروزهٔ کاشانی"}
      </button>
      {error && <p className="trainer-form-error" role="alert">{error}</p>}
    </div>
  );
}
