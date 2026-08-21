import { NextResponse, type NextRequest } from "next/server";
import { failPayment, finalizeSuccessfulPayment } from "@/lib/payments/service";
import { verifyWebhookSignature } from "@/lib/payments/provider";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ provider: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { provider } = await params;
  const payload = await request.text();
  if (!verifyWebhookSignature(payload, request.headers.get("x-payment-signature"))) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }
  let event: { eventId?: unknown; paymentId?: unknown; type?: unknown };
  try { event = JSON.parse(payload); } catch { return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 }); }
  const eventId = typeof event.eventId === "string" ? event.eventId : "";
  const paymentId = typeof event.paymentId === "string" ? event.paymentId : "";
  const type = typeof event.type === "string" ? event.type : "";
  if (!eventId || !paymentId || !type) return NextResponse.json({ error: "Webhook fields are missing." }, { status: 400 });

  const existing = await prisma.paymentEvent.findUnique({ where: { eventId }, select: { status: true } });
  if (existing) return NextResponse.json({ received: true, duplicate: true });
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, select: { id: true, provider: true } });
  const stored = await prisma.paymentEvent.create({ data: { paymentId: payment?.id ?? null, provider, eventId, type, payload, status: payment?.provider === provider ? "RECEIVED" : "IGNORED" }, select: { id: true, status: true } });
  if (!payment || payment.provider !== provider) return NextResponse.json({ received: true, ignored: true });

  try {
    if (type === "payment.succeeded") await finalizeSuccessfulPayment(payment.id, { actorRole: "WEBHOOK" });
    else if (type === "payment.failed") await failPayment(payment.id, "PROVIDER_DECLINED");
    else {
      await prisma.paymentEvent.update({ where: { id: stored.id }, data: { status: "IGNORED", processedAt: new Date() } });
      return NextResponse.json({ received: true, ignored: true });
    }
    await prisma.paymentEvent.update({ where: { id: stored.id }, data: { status: "PROCESSED", processedAt: new Date() } });
    return NextResponse.json({ received: true });
  } catch (error) {
    await prisma.paymentEvent.update({ where: { id: stored.id }, data: { status: "FAILED", processedAt: new Date() } });
    console.error("Payment webhook processing failed:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
