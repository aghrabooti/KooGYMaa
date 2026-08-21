import Link from "next/link";
import { AssignmentPanel } from "@/components/trainer/assignment-panel";
import { WorkoutPlanEditor } from "@/components/trainer/workout-plan-editor";
import { Icon } from "@/components/icon";
import { requireTrainerAccess } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ planId: string }> };

export default async function WorkoutPlanPage({ params }: PageProps) {
  const access = await requireTrainerAccess(); const { planId } = await params;
  const [plan, clients, gyms] = await Promise.all([
    prisma.workoutPlan.findFirst({ where: { id: planId, trainerId: access.profile.id }, select: { id: true, title: true, description: true, gymId: true, isTemplate: true, status: true, version: true, days: { orderBy: { dayNumber: "asc" }, select: { id: true, name: true, notes: true, exercises: { orderBy: { order: "asc" }, select: { id: true, name: true, sets: true, reps: true, weight: true, tempo: true, restSeconds: true, durationSeconds: true, distanceMeters: true, notes: true } } } }, assignments: { orderBy: { assignedAt: "desc" }, select: { id: true, status: true, assignedAt: true, trainerClient: { select: { id: true, user: { select: { name: true, email: true } } } } } }, _count: { select: { assignments: true } } } }),
    prisma.trainerClient.findMany({ where: { trainerId: access.profile.id, status: "ACTIVE" }, select: { id: true, user: { select: { name: true } } }, orderBy: { user: { name: "asc" } } }),
    prisma.gymTrainer.findMany({ where: { trainerId: access.profile.id, status: "ACTIVE" }, select: { gym: { select: { id: true, name: true } } }, orderBy: { gym: { name: "asc" } } }),
  ]);
  if (!plan) notFound();
  return <div className="trainer-page"><header className="trainer-page__heading trainer-page__heading--compact"><div><Link className="trainer-back" href="/trainer/workouts"><Icon name="chevron" size={14} /> Workout plans</Link><h1>{plan.title}</h1><p>Build the day-by-day structure, then publish an immutable version.</p></div></header><WorkoutPlanEditor gyms={gyms.map((item) => item.gym)} plan={{ id: plan.id, title: plan.title, description: plan.description, gymId: plan.gymId, isTemplate: plan.isTemplate, status: plan.status, version: plan.version, assignmentCount: plan._count.assignments, days: plan.days.map((day) => ({ key: day.id, name: day.name, notes: day.notes || "", exercises: day.exercises.map((exercise) => ({ key: exercise.id, name: exercise.name, sets: exercise.sets, reps: exercise.reps || "", weight: exercise.weight || "", tempo: exercise.tempo || "", restSeconds: exercise.restSeconds, durationSeconds: exercise.durationSeconds, distanceMeters: exercise.distanceMeters, notes: exercise.notes || "" })) })) }} /><AssignmentPanel kind="workouts" planId={plan.id} published={plan.status === "ACTIVE"} clients={clients.map((client) => ({ id: client.id, name: client.user.name }))} assignments={plan.assignments.filter((item) => item.trainerClient).map((item) => ({ id: item.id, status: item.status, assignedAt: item.assignedAt.toISOString(), name: item.trainerClient!.user.name, email: item.trainerClient!.user.email }))} /></div>;
}
