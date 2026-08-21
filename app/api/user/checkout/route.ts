import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { createSubscriptionCheckout } from "@/lib/payments/service";

export async function POST(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const body = await request.json().catch(() => null) as { planId?: unknown; renewalSubscriptionId?: unknown; idempotencyKey?: unknown } | null;
  const planId = typeof body?.planId === "string" ? body.planId : "";
  const renewalSubscriptionId = typeof body?.renewalSubscriptionId === "string" && body.renewalSubscriptionId ? body.renewalSubscriptionId : null;
  const headerKey = request.headers.get("idempotency-key");
  const idempotencyKey = (headerKey || (typeof body?.idempotencyKey === "string" ? body.idempotencyKey : "")).trim().slice(0, 120);
  if (!planId) return NextResponse.json({ error: "Choose a subscription plan." }, { status: 400 });
  if (idempotencyKey.length < 12) return NextResponse.json({ error: "A valid idempotency key is required." }, { status: 400 });
  try {
    const checkout = await createSubscriptionCheckout({ userId: authorization.user.id, planId, renewalSubscriptionId, idempotencyKey });
    return NextResponse.json(checkout, { status: checkout.reused ? 200 : 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "PLAN_NOT_FOUND") return NextResponse.json({ error: "This plan is not available for checkout." }, { status: 404 });
    if (code === "SUBSCRIPTION_NOT_FOUND") return NextResponse.json({ error: "Subscription cannot be renewed with this plan." }, { status: 404 });
    if (code === "IDEMPOTENCY_CONFLICT") return NextResponse.json({ error: "Idempotency key belongs to another checkout." }, { status: 409 });
    console.error("Checkout creation failed:", error);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
