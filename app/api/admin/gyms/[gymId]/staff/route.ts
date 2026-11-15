import { NextResponse, type NextRequest } from "next/server";
import { createManagedAccount } from "@/lib/accounts";
import { authorizeGymAdminRequest } from "@/lib/admin-access";

type Context = { params: Promise<{ gymId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { gymId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;
  if (authorization.access.staffRole !== "OWNER") {
    return NextResponse.json({ error: "فقط مالک باشگاه می‌تواند حساب مدیر بسازد." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  return createManagedAccount(body, "ADMIN", {
    gymStaffMemberships: {
      create: { gym: { connect: { id: gymId } }, role: "MANAGER", status: "ACTIVE" },
    },
  });
}
