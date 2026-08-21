import { NextResponse, type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { refundPayment } from "@/lib/payments/service";

type Context = { params: Promise<{ gymId: string; paymentId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { gymId, paymentId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;
  if (authorization.access.staffRole !== "OWNER") return NextResponse.json({ error: "Only a gym owner can refund payments." }, { status: 403 });
  try {
    const payment = await refundPayment({ actorId: authorization.access.user.id, actorRole: authorization.access.user.role, gymId, paymentId });
    return NextResponse.json({ payment });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYMENT_NOT_REFUNDABLE") return NextResponse.json({ error: "Payment is not refundable." }, { status: 409 });
    console.error("Refund failed:", error);
    return NextResponse.json({ error: "Unable to refund payment." }, { status: 500 });
  }
}
