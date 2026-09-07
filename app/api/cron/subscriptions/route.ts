import { NextResponse, type NextRequest } from "next/server";
import { sweepSubscriptions } from "@/lib/subscriptions-ops";

// Item 4: expiry + auto-renew + reminders. Protected by CRON_SECRET when set.
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const result = await sweepSubscriptions(new Date());
  return NextResponse.json(result);
}

export async function GET(request: NextRequest) {
  return POST(request);
}
