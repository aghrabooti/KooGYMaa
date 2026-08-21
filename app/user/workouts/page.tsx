import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { StartWorkout, WorkoutLogForm } from "@/components/user/workout-execution";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type PageProps = { searchParams: Promise<{ log?: string }> };
function date(value: Date) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value); }

export default async function UserWorkoutsPage({ searchParams }: PageProps) {
  const user = await requireCurrentUser(["USER"]); const { log: logId } = await searchParams;
  if (logId) {
    const log = await prisma.workoutLog.findFirst({ where: { id: logId, userId: user.id }, select: { id: true, workoutDay: { select: { name: true, plan: { select: { title: true } } } }, exerciseLogs: { orderBy: { exercise: { order: "asc" } }, select: { exerciseId: true, completed: true, actualSets: true, actualReps: true, actualWeight: true, rpe: true, notes: true, exercise: { select: { name: true, sets: true, reps: true, weight: true } } } } } });
    if (!log) notFound();
    return <div className="member-page"><WorkoutLogForm logId={log.id} title={`${log.workoutDay.plan.title} · ${log.workoutDay.name}`} initial={log.exerciseLogs.map((item) => ({ exerciseId: item.exerciseId, name: item.exercise.name, prescribedSets: item.exercise.sets, prescribedReps: item.exercise.reps, prescribedWeight: item.exercise.weight, completed: item.completed, actualSets: item.actualSets, actualReps: item.actualReps || "", actualWeight: item.actualWeight || "", rpe: item.rpe, notes: item.notes || "" }))} /></div>;
  }

  const [assignment, recent] = await Promise.all([
    prisma.workoutAssignment.findFirst({ where: { userId: user.id, status: "ACTIVE" }, select: { id: true, startDate: true, endDate: true, plan: { select: { title: true, description: true, version: true, trainer: { select: { user: { select: { name: true } } } }, days: { orderBy: { dayNumber: "asc" }, select: { id: true, dayNumber: true, name: true, notes: true, exercises: { select: { id: true, name: true, sets: true, reps: true, restSeconds: true } } } } } } }, orderBy: { assignedAt: "desc" } }),
    prisma.workoutLog.findMany({ where: { userId: user.id }, select: { id: true, status: true, startedAt: true, completedAt: true, perceivedEffort: true, workoutDay: { select: { name: true, plan: { select: { title: true } } } }, exerciseLogs: { select: { completed: true } } }, orderBy: { startedAt: "desc" }, take: 10 }),
  ]);
  const completed = recent.filter((item) => item.status === "COMPLETED").length;
  return <div className="member-page"><header className="member-page__heading"><div><span>TRAINING</span><h1>Your workout plan</h1><p>Follow the prescription, record your performance, and build momentum.</p></div></header>{assignment ? <><section className="member-plan-hero"><span><Icon name="dumbbell" size={25} /></span><div><small>ACTIVE PLAN · VERSION {assignment.plan.version}</small><h2>{assignment.plan.title}</h2><p>Coach {assignment.plan.trainer.user.name} · Started {assignment.startDate ? date(assignment.startDate) : "recently"}</p></div><div><strong>{assignment.plan.days.length}</strong><span>training days</span></div></section><div className="member-workout-grid">{assignment.plan.days.map((day) => <article key={day.id}><header><span>{day.dayNumber}</span><div><h2>{day.name}</h2><p>{day.notes || `${day.exercises.length} exercises`}</p></div></header><div>{day.exercises.map((exercise) => <div key={exercise.id}><span><Icon name="dumbbell" size={14} /></span><strong>{exercise.name}</strong><small>{exercise.sets || "—"} × {exercise.reps || "—"}{exercise.restSeconds ? ` · ${exercise.restSeconds}s rest` : ""}</small></div>)}</div><StartWorkout assignmentId={assignment.id} dayId={day.id} /></article>)}</div></> : <div className="member-panel member-empty"><Icon name="clipboard" size={27} /><h2>No active workout plan</h2><p>Your trainer hasn&apos;t assigned a workout plan yet.</p></div>}<section className="member-panel member-history"><div className="member-panel__heading"><div><h2>Workout history</h2><p>{completed} completed sessions</p></div></div>{recent.length ? <div>{recent.map((item) => { const done = item.exerciseLogs.filter((entry) => entry.completed).length; return <article key={item.id}><span className={`member-status member-status--${item.status.toLowerCase()}`}>{item.status}</span><div><strong>{item.workoutDay.name}</strong><small>{item.workoutDay.plan.title} · {date(item.startedAt)}</small></div><b>{done}/{item.exerciseLogs.length} exercises</b><small>RPE {item.perceivedEffort || "—"}</small></article>; })}</div> : <p className="member-empty-line">Your completed workouts will appear here.</p>}</section></div>;
}
