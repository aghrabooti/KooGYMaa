import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { confirmDemoPayment, failPayment } from "@/lib/payments/service";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ paymentId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { paymentId } = await params;
  const body = await request.json().catch(() => null) as { action?: unknown; token?: unknown } | null;
  const action = body?.action === "fail" ? "fail" : "confirm";
  const token = typeof body?.token === "string" ? body.token : "";
  try {
    if (action === "fail") {
      const owned = await prisma.payment.findFirst({ where: { id: paymentId, userId: authorization.user.id, provider: "demo", status: { in: ["PENDING", "PROCESSING"] } }, select: { id: true } });
      if (!owned) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
      return NextResponse.json({ payment: await failPayment(owned.id) });
    }
    return NextResponse.json({ payment: await confirmDemoPayment({ paymentId, userId: authorization.user.id, token }) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "PAYMENT_NOT_FOUND") return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    if (code === "INVALID_CHECKOUT_TOKEN") return NextResponse.json({ error: "Checkout token is invalid or expired." }, { status: 403 });
    if (code === "PAYMENT_NOT_PAYABLE") return NextResponse.json({ error: "This payment cannot be completed." }, { status: 409 });
    console.error("Payment confirmation failed:", error);
    return NextResponse.json({ error: "Unable to confirm payment." }, { status: 500 });
  }
}
