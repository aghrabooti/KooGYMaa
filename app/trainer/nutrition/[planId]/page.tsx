import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignmentPanel } from "@/components/trainer/assignment-panel";
import { NutritionPlanEditor } from "@/components/trainer/nutrition-plan-editor";
import { Icon } from "@/components/icon";
import { requireTrainerAccess } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ planId: string }> };

export default async function NutritionPlanPage({ params }: PageProps) {
  const access = await requireTrainerAccess(); const { planId } = await params;
  const [plan, clients, gyms] = await Promise.all([
    prisma.dietPlan.findFirst({ where: { id: planId, trainerId: access.profile.id }, select: { id: true, title: true, description: true, dietaryRestrictions: true, dailyCalories: true, gymId: true, isTemplate: true, status: true, version: true, days: { orderBy: { dayNumber: "asc" }, select: { id: true, name: true, notes: true, targetCalories: true, targetProtein: true, targetCarbs: true, targetFat: true, meals: { orderBy: { order: "asc" }, select: { id: true, name: true, scheduledTime: true, notes: true, foodItems: { orderBy: { order: "asc" }, select: { id: true, name: true, quantity: true, unit: true, calories: true, protein: true, carbs: true, fat: true, notes: true } } } } } }, assignments: { orderBy: { assignedAt: "desc" }, select: { id: true, status: true, assignedAt: true, trainerClient: { select: { id: true, user: { select: { name: true, email: true } } } } } }, _count: { select: { assignments: true } } } }),
    prisma.trainerClient.findMany({ where: { trainerId: access.profile.id, status: "ACTIVE" }, select: { id: true, user: { select: { name: true } } }, orderBy: { user: { name: "asc" } } }),
    prisma.gymTrainer.findMany({ where: { trainerId: access.profile.id, status: "ACTIVE" }, select: { gym: { select: { id: true, name: true } } }, orderBy: { gym: { name: "asc" } } }),
  ]);
  if (!plan) notFound();
  return <div className="trainer-page"><header className="trainer-page__heading trainer-page__heading--compact"><div><Link className="trainer-back" href="/trainer/nutrition"><Icon name="chevron" size={14} /> Nutrition plans</Link><h1>{plan.title}</h1><p>Define meals, portions, calories, and macro targets for this version.</p></div></header><NutritionPlanEditor gyms={gyms.map((item) => item.gym)} plan={{ id: plan.id, title: plan.title, description: plan.description, dietaryRestrictions: plan.dietaryRestrictions, dailyCalories: plan.dailyCalories, gymId: plan.gymId, isTemplate: plan.isTemplate, status: plan.status, version: plan.version, assignmentCount: plan._count.assignments, days: plan.days.map((day) => ({ key: day.id, name: day.name, notes: day.notes || "", targetCalories: day.targetCalories, targetProtein: day.targetProtein, targetCarbs: day.targetCarbs, targetFat: day.targetFat, meals: day.meals.map((meal) => ({ key: meal.id, name: meal.name, scheduledTime: meal.scheduledTime || "", notes: meal.notes || "", foodItems: meal.foodItems.map((food) => ({ key: food.id, name: food.name, quantity: food.quantity, unit: food.unit || "", calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat, notes: food.notes || "" })) })) })) }} /><AssignmentPanel kind="nutrition" planId={plan.id} published={plan.status === "ACTIVE"} clients={clients.map((client) => ({ id: client.id, name: client.user.name }))} assignments={plan.assignments.filter((item) => item.trainerClient).map((item) => ({ id: item.id, status: item.status, assignedAt: item.assignedAt.toISOString(), name: item.trainerClient!.user.name, email: item.trainerClient!.user.email }))} /></div>;
}
