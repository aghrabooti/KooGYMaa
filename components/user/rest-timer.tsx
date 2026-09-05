"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";

// Item 8: rest timer between sets (preset + custom, audible + visual finish).
const PRESETS = [30, 60, 90, 120, 180];

export function RestTimer({ defaultSeconds = 90 }: { defaultSeconds?: number }) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [left, setLeft] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function start(total: number) {
    if (timer.current) clearInterval(timer.current);
    setLeft(total);
    timer.current = setInterval(() => {
      setLeft((v) => {
        if (v === null || v <= 1) {
          if (timer.current) clearInterval(timer.current);
          try {
            const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new Ctx();
            const osc = ctx.createOscillator();
            osc.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
            osc.onended = () => ctx.close();
          } catch { /* silent */ }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    setLeft(null);
  }

  const mm = left === null ? null : `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;

  return (
    <div className="rest-timer" aria-live="polite">
      <span className="rest-timer__label"><Icon name="clock" size={15} /> تایمر استراحت</span>
      {mm === null ? (
        <div className="rest-timer__presets">
          {PRESETS.map((p) => (
            <button key={p} type="button" className={seconds === p ? "active" : ""} onClick={() => { setSeconds(p); start(p); }}>
              {p >= 60 ? `${p / 60} دقیقه` : `${p} ثانیه`}
            </button>
          ))}
          <span className="rest-timer__custom">
            <input inputMode="numeric" placeholder="ثانیه…" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="زمان دلخواه به ثانیه" />
            <button type="button" onClick={() => { const n = Number(custom); if (n > 0 && n <= 1800) start(Math.floor(n)); }}>شروع</button>
          </span>
        </div>
      ) : (
        <div className={`rest-timer__count ${left === 0 ? "done" : ""}`}>
          <strong>{left === 0 ? "استراحت تمام شد! 💪" : mm}</strong>
          {left !== 0 && <button type="button" onClick={() => start(seconds)}>از اول</button>}
          <button type="button" onClick={stop}>بستن</button>
        </div>
      )}
    </div>
  );
}
