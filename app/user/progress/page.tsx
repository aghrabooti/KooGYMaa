import { FeedbackReply, MeasurementForm } from "@/components/user/progress-controls";
import { ProgressChart } from "@/components/user/progress-chart";
import { GoalsPanel } from "@/components/user/goals-panel";
import { PhotoUpload } from "@/components/user/photo-upload";
import { Icon } from "@/components/icon";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function photoSrc(imageUrl: string, id: string): string {
  if (/^https?:\/\//.test(imageUrl)) return imageUrl;
  return `/api/user/progress-photos/${id}`;
}

export default async function UserProgressPage() {
  const user = await requireCurrentUser(["USER"]);
  const since = new Date(); since.setDate(since.getDate() - 30);
  const [measurements, workoutLogs, nutritionLogs, feedback] = await Promise.all([
    prisma.bodyMeasurement.findMany({ where: { userId: user.id }, select: { id: true, recordedAt: true, weightKg: true, bodyFatPercent: true, waistCm: true, chestCm: true, armCm: true, hipsCm: true, thighCm: true, notes: true, photos: { select: { id: true, imageUrl: true, pose: true } } }, orderBy: { recordedAt: "asc" }, take: 100 }),
    prisma.workoutLog.findMany({ where: { userId: user.id, startedAt: { gte: since } }, select: { status: true, exerciseLogs: { select: { completed: true } } } }),
    prisma.nutritionLog.findMany({ where: { userId: user.id, logDate: { gte: since } }, select: { completedAt: true, mealLogs: { select: { completed: true } } } }),
    prisma.feedback.findMany({ where: { recipientId: user.id, parentId: null }, select: { id: true, type: true, content: true, createdAt: true, author: { select: { name: true } }, workoutLog: { select: { workoutDay: { select: { name: true } } } }, nutritionLog: { select: { dietDay: { select: { name: true } } } }, replies: { select: { id: true, content: true, createdAt: true, author: { select: { name: true } } }, orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const first = measurements[0]; const latest = measurements.at(-1);
  const weightChange = first?.weightKg && latest?.weightKg ? latest.weightKg - first.weightKg : null;
  const exerciseTotal = workoutLogs.reduce((sum: any, log: any) => sum + log.exerciseLogs.length, 0);
  const exerciseDone = workoutLogs.reduce((sum: any, log: any) => sum + log.exerciseLogs.filter((entry: any) => entry.completed).length, 0);
  const mealTotal = nutritionLogs.reduce((sum: any, log: any) => sum + log.mealLogs.length, 0);
  const mealDone = nutritionLogs.reduce((sum: any, log: any) => sum + log.mealLogs.filter((entry: any) => entry.completed).length, 0);
  const workoutCompliance = exerciseTotal ? Math.round((exerciseDone / exerciseTotal) * 100) : 0;
  const mealCompliance = mealTotal ? Math.round((mealDone / mealTotal) * 100) : 0;
  const chartPoints = measurements.map((m: any) => ({ at: m.recordedAt.toISOString(), weightKg: m.weightKg, bodyFatPercent: m.bodyFatPercent, waistCm: m.waistCm, chestCm: m.chestCm }));
  const allPhotos = measurements.flatMap((m: any) => m.photos.map((p: any) => ({ ...p, at: m.recordedAt })) ).sort((a: any, b: any) => +new Date(b.at) - +new Date(a.at));

  return (
    <div className="member-page">
      <header className="member-page__heading"><div><span>PROGRESS</span><h1>Your progress story</h1><p>Measurements, plan consistency, and feedback in one place.</p></div><MeasurementForm /></header>
      <section className="member-progress-metrics">
        <article><span><Icon name="trend" size={19} /></span><small>Current weight</small><strong>{latest?.weightKg ? `${latest.weightKg} kg` : "—"}</strong><p>{weightChange === null ? "Add your first check-in" : `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg overall`}</p></article>
        <article><span><Icon name="dumbbell" size={19} /></span><small>Workout compliance</small><strong>{workoutCompliance}%</strong><p>{exerciseDone} of {exerciseTotal} exercises</p></article>
        <article><span><Icon name="heart" size={19} /></span><small>Nutrition compliance</small><strong>{mealCompliance}%</strong><p>{mealDone} of {mealTotal} meals</p></article>
        <article><span><Icon name="clipboard" size={19} /></span><small>Coach feedback</small><strong>{feedback.length}</strong><p>feedback threads</p></article>
      </section>
      <ProgressChart points={chartPoints} />
      <div className="member-progress-grid">
        <section className="member-panel member-measurements">
          <div className="member-panel__heading"><div><h2>Latest measurements</h2><p>{latest ? latest.recordedAt.toLocaleDateString() : "No data yet"}</p></div></div>
          {latest ? <div>{[["Body fat", latest.bodyFatPercent, "%"], ["Waist", latest.waistCm, "cm"], ["Chest", latest.chestCm, "cm"], ["Arm", latest.armCm, "cm"], ["Hips", latest.hipsCm, "cm"], ["Thigh", latest.thighCm, "cm"]].map(([label, value, unit]) => <span key={String(label)}><small>{label}</small><strong>{value ? `${value} ${unit}` : "—"}</strong></span>)}</div> : <p className="member-empty-line">No measurements yet.</p>}
        </section>
        <GoalsPanel latest={{ weightKg: latest?.weightKg ?? null, bodyFatPercent: latest?.bodyFatPercent ?? null, waistCm: latest?.waistCm ?? null }} />
      </div>
      <section className="member-panel member-photos" aria-label="تصاویر پیشرفت">
        <div className="member-panel__heading"><div><h2>Progress photos</h2><p>Private — only you, your trainer, and your gym admin can view</p></div><PhotoUpload measurementId={latest?.id} /></div>
        {allPhotos.length ? (
          <div className="member-photo-grid">
            {allPhotos.slice(0, 12).map((photo: any) => (
              <a key={photo.id} href={photoSrc(photo.imageUrl, photo.id)} target="_blank" rel="noreferrer" title={`${photo.pose || "progress"} — ${new Date(photo.at).toLocaleDateString("fa-IR")}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoSrc(photo.imageUrl, photo.id)} alt={`${photo.pose || "progress"} photo`} loading="lazy" />
                <small>{photo.pose || "progress"}</small>
              </a>
            ))}
          </div>
        ) : <p className="member-empty-line">Upload your first progress photo — real files, stored privately.</p>}
      </section>
      <section className="member-panel member-feedback"><div className="member-panel__heading"><div><h2>Trainer feedback</h2><p>Guidance tied to your recent execution</p></div></div>{feedback.length ? <div>{feedback.map((item: any) => <article key={item.id}><span className="member-feedback-avatar">{item.author.name.slice(0, 2).toUpperCase()}</span><div><header><strong>{item.author.name}</strong><b>{item.type}</b><small>{item.createdAt.toLocaleDateString()}</small></header><p>{item.content}</p>{(item.workoutLog || item.nutritionLog) && <em>{item.workoutLog?.workoutDay.name || item.nutritionLog?.dietDay.name}</em>}{item.replies.map((reply: any) => <div className="member-feedback-reply" key={reply.id}><strong>{reply.author.name}</strong><p>{reply.content}</p></div>)}<FeedbackReply feedbackId={item.id} /></div></article>)}</div> : <p className="member-empty-line">Feedback from your trainer will appear here.</p>}</section>
    </div>
  );
}
