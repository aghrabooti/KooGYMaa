import "server-only";

import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";
import type {
  PlanDocumentData,
  PlanKind,
  PlanMeal,
  PlanNutritionDay,
  PlanWorkoutDay,
} from "@/lib/plan-document";

export type PreviewStudent = {
  id: string;
  name: string;
  email: string | null;
  assigned: boolean;
};

export type LoadedPlan = {
  doc: PlanDocumentData | null;
  students: PreviewStudent[];
  selectedStudentId: string | null;
};

type AssignmentRow = {
  id: string;
  trainerClientId: string | null;
  userId: string;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
};

const EMPTY: LoadedPlan = { doc: null, students: [], selectedStudentId: null };

async function trainerContext(profileId: string, planId: string, kind: PlanKind, studentId?: string) {
  const clients = await prisma.trainerClient.findMany({
    where: { trainerId: profileId, status: "ACTIVE" },
    select: { id: true, user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: "asc" } },
  });

  const assignments: AssignmentRow[] =
    kind === "workouts"
      ? await prisma.workoutAssignment.findMany({
          where: { planId, status: { not: "CANCELLED" } },
          select: { id: true, trainerClientId: true, userId: true, startDate: true, endDate: true, status: true },
        })
      : await prisma.dietAssignment.findMany({
          where: { planId, status: { not: "CANCELLED" } },
          select: { id: true, trainerClientId: true, userId: true, startDate: true, endDate: true, status: true },
        });

  const assignedClientIds = new Set(
    assignments.map((item) => item.trainerClientId).filter((value): value is string => Boolean(value)),
  );
  const students: PreviewStudent[] = clients.map((client) => ({
    id: client.user.id,
    name: client.user.name,
    email: client.user.email,
    assigned: assignedClientIds.has(client.id),
  }));

  const selected =
    (studentId ? students.find((student) => student.id === studentId) : undefined) ??
    students.find((student) => student.assigned) ??
    students[0] ??
    null;

  const selectedClient = selected ? clients.find((client) => client.user.id === selected.id) : null;
  const assignment = selectedClient
    ? assignments.find((item) => item.trainerClientId === selectedClient.id || item.userId === selected.id) ?? null
    : null;

  return { students, selected, assignment };
}

async function memberAssignment(userId: string, planId: string, kind: PlanKind): Promise<AssignmentRow | null> {
  const row =
    kind === "workouts"
      ? await prisma.workoutAssignment.findFirst({
          where: { planId, userId, status: "ACTIVE" },
          select: { id: true, trainerClientId: true, userId: true, startDate: true, endDate: true, status: true },
        })
      : await prisma.dietAssignment.findFirst({
          where: { planId, userId, status: "ACTIVE" },
          select: { id: true, trainerClientId: true, userId: true, startDate: true, endDate: true, status: true },
        });
  return (row as AssignmentRow | null) ?? null;
}

function baseFields(input: {
  planId: string;
  title: string;
  description: string | null;
  status: string;
  version: number;
  isTemplate: boolean;
  gymName: string | null;
  trainerName: string;
  trainerSpecialty: string | null;
  studentName: string;
  studentEmail: string | null;
  studentId: string | null;
  assignment: AssignmentRow | null;
}) {
  return {
    planId: input.planId,
    title: input.title,
    description: input.description,
    status: input.status,
    version: input.version,
    isTemplate: input.isTemplate,
    gymName: input.gymName,
    trainerName: input.trainerName,
    trainerSpecialty: input.trainerSpecialty,
    studentName: input.studentName,
    studentEmail: input.studentEmail,
    studentId: input.studentId,
    issuedAt: new Date().toISOString(),
    startDate: input.assignment?.startDate?.toISOString() ?? null,
    endDate: input.assignment?.endDate?.toISOString() ?? null,
    genericPreview: !input.studentName || input.studentName === "—",
  };
}

/**
 * Builds the printable plan for either role:
 * - TRAINER: only own plans; a student can be chosen from their active clients.
 * - USER: only plans actually assigned to them.
 * The returned document always carries student + trainer names for the header.
 */
export async function loadPlanDocument(
  user: SessionUser,
  kind: PlanKind,
  planId: string,
  studentId?: string,
): Promise<LoadedPlan> {
  if (!planId) return EMPTY;

  const profile =
    user.role === "TRAINER"
      ? await prisma.trainerProfile.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })
      : null;
  if (user.role === "TRAINER" && !profile) return EMPTY;
  if (user.role !== "TRAINER" && user.role !== "USER") return EMPTY;

  if (kind === "workouts") {
    const plan = await prisma.workoutPlan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        trainerId: true,
        title: true,
        description: true,
        status: true,
        version: true,
        isTemplate: true,
        gym: { select: { name: true } },
        trainer: { select: { specialty: true, user: { select: { name: true } } } },
        days: {
          orderBy: { dayNumber: "asc" },
          select: {
            id: true,
            dayNumber: true,
            name: true,
            notes: true,
            exercises: {
              orderBy: { order: "asc" },
              select: {
                name: true,
                sets: true,
                reps: true,
                weight: true,
                tempo: true,
                restSeconds: true,
                durationSeconds: true,
                distanceMeters: true,
                notes: true,
              },
            },
          },
        },
      },
    });
    if (!plan) return EMPTY;

    let students: PreviewStudent[] = [];
    let selectedStudentId: string | null = null;
    let assignment: AssignmentRow | null = null;
    let studentName = user.name;
    let studentEmail: string | null = user.email;

    if (user.role === "TRAINER") {
      if (plan.trainerId !== profile!.id) return EMPTY;
      const context = await trainerContext(profile!.id, plan.id, kind, studentId);
      students = context.students;
      selectedStudentId = context.selected?.id ?? null;
      assignment = context.assignment;
      studentName = context.selected?.name ?? "—";
      studentEmail = context.selected?.email ?? null;
    } else {
      assignment = await memberAssignment(user.id, plan.id, kind);
      if (!assignment) return EMPTY;
    }

    const days: PlanWorkoutDay[] = plan.days.map((day: any) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      name: day.name,
      notes: day.notes ?? null,
      exercises: day.exercises.map((exercise: any) => ({
        name: exercise.name,
        sets: exercise.sets ?? null,
        reps: exercise.reps ?? null,
        weight: exercise.weight ?? null,
        tempo: exercise.tempo ?? null,
        restSeconds: exercise.restSeconds ?? null,
        durationSeconds: exercise.durationSeconds ?? null,
        distanceMeters: exercise.distanceMeters ?? null,
        notes: exercise.notes ?? null,
      })),
    }));

    return {
      doc: {
        kind: "workouts",
        ...baseFields({
          planId: plan.id,
          title: plan.title,
          description: plan.description,
          status: plan.status,
          version: plan.version,
          isTemplate: plan.isTemplate,
          gymName: plan.gym?.name ?? null,
          trainerName: plan.trainer.user.name,
          trainerSpecialty: plan.trainer.specialty ?? null,
          studentName,
          studentEmail,
          studentId: user.role === "TRAINER" ? selectedStudentId : user.id,
          assignment,
        }),
        days,
      },
      students,
      selectedStudentId,
    };
  }

  const plan = await prisma.dietPlan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      trainerId: true,
      title: true,
      description: true,
      dietaryRestrictions: true,
      dailyCalories: true,
      status: true,
      version: true,
      isTemplate: true,
      gym: { select: { name: true } },
      trainer: { select: { specialty: true, user: { select: { name: true } } } },
      days: {
        orderBy: { dayNumber: "asc" },
        select: {
          id: true,
          dayNumber: true,
          name: true,
          notes: true,
          targetCalories: true,
          targetProtein: true,
          targetCarbs: true,
          targetFat: true,
          meals: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              scheduledTime: true,
              notes: true,
              foodItems: {
                orderBy: { order: "asc" },
                select: {
                  name: true,
                  quantity: true,
                  unit: true,
                  calories: true,
                  protein: true,
                  carbs: true,
                  fat: true,
                  notes: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!plan) return EMPTY;

  let students: PreviewStudent[] = [];
  let selectedStudentId: string | null = null;
  let assignment: AssignmentRow | null = null;
  let studentName = user.name;
  let studentEmail: string | null = user.email;

  if (user.role === "TRAINER") {
    if (plan.trainerId !== profile!.id) return EMPTY;
    const context = await trainerContext(profile!.id, plan.id, kind, studentId);
    students = context.students;
    selectedStudentId = context.selected?.id ?? null;
    assignment = context.assignment;
    studentName = context.selected?.name ?? "—";
    studentEmail = context.selected?.email ?? null;
  } else {
    assignment = await memberAssignment(user.id, plan.id, kind);
    if (!assignment) return EMPTY;
  }

  const days: PlanNutritionDay[] = plan.days.map((day: any) => ({
    id: day.id,
    dayNumber: day.dayNumber,
    name: day.name,
    notes: day.notes ?? null,
    targetCalories: day.targetCalories ?? null,
    targetProtein: day.targetProtein ?? null,
    targetCarbs: day.targetCarbs ?? null,
    targetFat: day.targetFat ?? null,
    meals: day.meals.map(
      (meal: any): PlanMeal => ({
        id: meal.id,
        name: meal.name,
        scheduledTime: meal.scheduledTime ?? null,
        notes: meal.notes ?? null,
        foodItems: meal.foodItems.map((food: any) => ({
          name: food.name,
          quantity: food.quantity ?? null,
          unit: food.unit ?? null,
          calories: food.calories ?? null,
          protein: food.protein ?? null,
          carbs: food.carbs ?? null,
          fat: food.fat ?? null,
          notes: food.notes ?? null,
        })),
      }),
    ),
  }));

  return {
    doc: {
      kind: "nutrition",
      ...baseFields({
        planId: plan.id,
        title: plan.title,
        description: plan.description,
        status: plan.status,
        version: plan.version,
        isTemplate: plan.isTemplate,
        gymName: plan.gym?.name ?? null,
        trainerName: plan.trainer.user.name,
        trainerSpecialty: plan.trainer.specialty ?? null,
        studentName,
        studentEmail,
        studentId: user.role === "TRAINER" ? selectedStudentId : user.id,
        assignment,
      }),
      dailyCalories: plan.dailyCalories ?? null,
      dietaryRestrictions: plan.dietaryRestrictions ?? null,
      days,
    },
    students,
    selectedStudentId,
  };
}
