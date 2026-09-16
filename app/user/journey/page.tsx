import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calculateMonthsAsStudent, formatJourneyDuration, buildNimaJourney } from "@/lib/journey";

export default async function UserJourneyPage() {
  const user = await requireCurrentUser(["USER"]);

  const clients = await prisma.trainerClient.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: {
      trainer: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { startedAt: "asc" },
  });

  const measurements = await prisma.bodyMeasurement.findMany({
    where: { userId: user.id },
    orderBy: { recordedAt: "asc" },
    take: 100,
  });

  const isNima = user.email === "member@koogymaa.test";
  const detailedJourney = isNima ? buildNimaJourney() : [];

  const firstClient = clients[0];
  const startedAt = firstClient?.startedAt || firstClient?.createdAt;
  const monthsAsStudent = startedAt ? calculateMonthsAsStudent(startedAt) : 0;
  const durationFa = startedAt ? formatJourneyDuration(startedAt) : "۰ روز";

  return (
    <div className="member-page">
      <header className="member-page__heading">
        <div>
          <span>مسیر شاگردی</span>
          <h1>چند ماهه شاگرد هستی؟</h1>
          <p>
            {firstClient
              ? `شما ${durationFa} شاگرد ${firstClient.trainer.user.name} هستید — از ${startedAt?.toLocaleDateString("fa-IR")} تا امروز`
              : "هنوز شاگرد مربی‌ای نیستید"}
          </p>
        </div>
      </header>

      {firstClient && (
        <section className="member-panel" style={{ marginBottom: "1.5rem" }}>
          <div className="member-panel__heading">
            <div>
              <h2>خلاصه مسیر</h2>
              <p>از روز اول تا الان</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", padding: "1rem" }}>
            <article style={{ background: "var(--card-bg, #f9f9f9)", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
              <small style={{ display: "block", opacity: 0.7 }}>مدت شاگردی</small>
              <strong style={{ fontSize: "1.5rem", display: "block", margin: "0.5rem 0" }}>{durationFa}</strong>
              <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>{monthsAsStudent} ماه کامل</p>
            </article>
            <article style={{ background: "var(--card-bg, #f9f9f9)", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
              <small style={{ display: "block", opacity: 0.7 }}>مربی</small>
              <strong style={{ fontSize: "1.2rem", display: "block", margin: "0.5rem 0" }}>{firstClient.trainer.user.name}</strong>
              <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>{firstClient.trainer.user.email}</p>
            </article>
            <article style={{ background: "var(--card-bg, #f9f9f9)", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
              <small style={{ display: "block", opacity: 0.7 }}>تعداد اندازه‌گیری</small>
              <strong style={{ fontSize: "1.5rem", display: "block", margin: "0.5rem 0" }}>{measurements.length}</strong>
              <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>از شروع تا الان</p>
            </article>
            <article style={{ background: "var(--card-bg, #f9f9f9)", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
              <small style={{ display: "block", opacity: 0.7 }}>تغییر وزن</small>
              <strong style={{ fontSize: "1.5rem", display: "block", margin: "0.5rem 0", color: "var(--success, green)" }}>
                {measurements.length >= 2 && measurements[0].weightKg && measurements[measurements.length - 1].weightKg
                  ? `${(measurements[measurements.length - 1].weightKg! - measurements[0].weightKg!).toFixed(1)} کیلو`
                  : "—"}
              </strong>
              <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>از روز اول</p>
            </article>
          </div>
        </section>
      )}

      {isNima && detailedJourney.length > 0 && (
        <section className="member-panel">
          <div className="member-panel__heading">
            <div>
              <h2>مسیر ۶ ماهه نیما — از ۸۵.۲ کیلو تا ۸۰ کیلو</h2>
              <p>هر ماه چه اتفاقی افتاد؟</p>
            </div>
          </div>
          <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {detailedJourney.map((month) => (
              <div
                key={month.monthNumber}
                style={{
                  display: "flex",
                  gap: "1rem",
                  padding: "1.2rem",
                  borderRadius: "12px",
                  background: month.monthNumber === 6 ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "var(--card-bg, #f9f9f9)",
                  color: month.monthNumber === 6 ? "white" : "inherit",
                  border: "1px solid var(--border, #eee)",
                }}
              >
                <div
                  style={{
                    minWidth: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: month.monthNumber === 6 ? "rgba(255,255,255,0.2)" : "var(--primary, #667eea)",
                    color: month.monthNumber === 6 ? "white" : "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                  }}
                >
                  {month.monthNumber}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>{month.monthNameFa}</h3>
                  <p style={{ margin: "0 0 0.5rem 0", opacity: 0.9, fontSize: "0.95rem" }}>{month.notes}</p>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", margin: "0.5rem 0", fontSize: "0.85rem" }}>
                    {month.weightKg && <span>⚖️ {month.weightKg} کیلو</span>}
                    {month.bodyFatPercent && <span>📊 {month.bodyFatPercent}% چربی</span>}
                    {month.waistCm && <span>📏 کمر {month.waistCm} سانت</span>}
                    {month.armCm && <span>💪 بازو {month.armCm} سانت</span>}
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
                    {month.achievements.map((ach, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-block",
                          background: month.monthNumber === 6 ? "rgba(255,255,255,0.2)" : "var(--badge-bg, #e0e7ff)",
                          color: month.monthNumber === 6 ? "white" : "var(--badge-text, #3730a3)",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          margin: "0.2rem",
                        }}
                      >
                        ✅ {ach}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isNima && clients.length > 0 && (
        <section className="member-panel">
          <div className="member-panel__heading">
            <div>
              <h2>مسیر شما</h2>
              <p>از شروع تا الان</p>
            </div>
          </div>
          <div style={{ padding: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {measurements.map((m, idx) => (
                <div key={m.id} style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "0.8rem", background: "var(--card-bg, #f9f9f9)", borderRadius: "8px" }}>
                  <div style={{ minWidth: "40px", height: "40px", borderRadius: "50%", background: "#667eea", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                    {idx + 1}
                  </div>
                  <div>
                    <strong>{m.recordedAt.toLocaleDateString("fa-IR")}</strong>
                    <p style={{ margin: "0.2rem 0", fontSize: "0.9rem" }}>
                      {m.weightKg ? `${m.weightKg} کیلو` : ""} {m.bodyFatPercent ? `| ${m.bodyFatPercent}% چربی` : ""} {m.notes ? `— ${m.notes}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="member-panel" style={{ marginTop: "1.5rem" }}>
        <div className="member-panel__heading">
          <div>
            <h2>چطور ماه‌ها محاسبه می‌شود؟</h2>
            <p>فرمول ساده</p>
          </div>
        </div>
        <div style={{ padding: "1rem", lineHeight: "1.8" }}>
          <p>
            مدت شاگردی از تاریخ <code>startedAt</code> در جدول <code>TrainerClient</code> محاسبه می‌شود.
            هر بار که مربی سارا یک شاگرد را می‌پذیرد، این تاریخ ثبت می‌شود.
          </p>
          <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "8px", overflowX: "auto", direction: "ltr", textAlign: "left" }}>
            {`function calculateMonthsAsStudent(startedAt: Date): number {
  const now = new Date();
  const years = now.getFullYear() - startedAt.getFullYear();
  const months = now.getMonth() - startedAt.getMonth();
  return years * 12 + months;
}

// برای نیما:
// startedAt = 6 ماه قبل
// months = 6
// durationFa = "۶ ماه"`}
          </pre>
          <p>
            برای نیما: <strong>شروع از ۶ ماه قبل</strong> — الان دقیقا ۶ ماهه شاگرد سارا است.
            <br />
            برای سحر: ۴ ماه، رضا: ۳ ماه، آرمان: ۲ ماه، پریسا: ۱ ماه.
          </p>
        </div>
      </section>
    </div>
  );
}
