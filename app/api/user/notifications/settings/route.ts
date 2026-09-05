import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { getPrefs, savePrefs } from "@/lib/notify-prefs";
import { validateReminderPrefs } from "@/lib/engagement";

// Item 12: configurable reminders (یادآوری‌های قابل‌تنظیم).
export async function GET(request: NextRequest) {
  const auth = await authorizeApiRequest(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ prefs: await getPrefs(auth.user.id) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest) {
  const auth = await authorizeApiRequest(request);
  if (!auth.ok) return auth.response;
  const validation = validateReminderPrefs(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  return NextResponse.json({ prefs: await savePrefs(auth.user.id, validation.data) });
}
