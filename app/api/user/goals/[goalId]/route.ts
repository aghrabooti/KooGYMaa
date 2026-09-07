import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { deleteGoal } from "@/lib/goals-store";

type Ctx = { params: Promise<{ goalId: string }> };

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const auth = await authorizeApiRequest(request, ["USER"]);
  if (!auth.ok) return auth.response;
  const { goalId } = await params;
  const ok = await deleteGoal(auth.user.id, goalId);
  if (!ok) return NextResponse.json({ error: "هدف یافت نشد." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
