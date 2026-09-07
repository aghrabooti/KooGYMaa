import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { createGoal, listGoals } from "@/lib/goals-store";

// Item 9: fitness goals (هدف‌گذاری).
export async function GET(request: NextRequest) {
  const auth = await authorizeApiRequest(request, ["USER"]);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ goals: await listGoals(auth.user.id) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const auth = await authorizeApiRequest(request, ["USER"]);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null) as { kind?: unknown; target?: unknown; unit?: unknown; deadline?: unknown } | null;
  const kind = typeof body?.kind === "string" ? body.kind.trim() : "";
  const target = typeof body?.target === "number" ? body.target : Number(body?.target);
  const unit = typeof body?.unit === "string" ? body.unit.trim() : "";
  const allowed = new Set(["weight", "body_fat", "waist", "workouts_per_week", "custom"]);
  if (!allowed.has(kind)) return NextResponse.json({ error: "نوع هدف نامعتبر است." }, { status: 400 });
  if (!Number.isFinite(target) || target <= 0 || target > 1_000_000) return NextResponse.json({ error: "مقدار هدف نامعتبر است." }, { status: 400 });
  if (!unit) return NextResponse.json({ error: "واحد هدف را وارد کنید." }, { status: 400 });
  const deadline = typeof body?.deadline === "string" && body.deadline ? new Date(body.deadline) : null;
  if (body?.deadline && (!deadline || Number.isNaN(deadline.getTime()))) return NextResponse.json({ error: "تاریخ هدف نامعتبر است." }, { status: 400 });
  const goal = await createGoal(auth.user.id, { kind, target, unit, deadline: deadline?.toISOString() ?? null });
  return NextResponse.json({ goal }, { status: 201 });
}
