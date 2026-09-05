import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkGeneralRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

// Item 9: real private photo upload (multipart) — files live outside public/,
 // served only through the authenticated [photoId] route.
export async function POST(request: NextRequest) {
  const throttle = checkGeneralRateLimit(request, 30);
  if (!throttle.allowed) return rateLimitResponse(throttle);
  const auth = await authorizeApiRequest(request, ["USER"]);
  if (!auth.ok) return auth.response;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "ارسال تصویر نامعتبر است." }, { status: 400 });
  }
  const file = form.get("photo");
  const poseRaw = form.get("pose");
  const measurementRaw = form.get("measurementId");
  const pose = typeof poseRaw === "string" && poseRaw.trim() ? poseRaw.trim().slice(0, 50) : null;
  const measurementId = typeof measurementRaw === "string" && measurementRaw ? measurementRaw : null;
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "یک فایل تصویری انتخاب کنید." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "حجم تصویر نباید بیشتر از ۵ مگابایت باشد." }, { status: 400 });
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json({ error: "فقط JPEG، PNG، WebP یا GIF مجاز است." }, { status: 400 });
  }
  if (measurementId) {
    const m = await prisma.bodyMeasurement.findFirst({ where: { id: measurementId, userId: auth.user.id }, select: { id: true } });
    if (!m) return NextResponse.json({ error: "رکورد اندازه‌گیری یافت نشد." }, { status: 404 });
  }
  const dir = join(process.cwd(), "data", "uploads", auth.user.id);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));
  const photo = await prisma.progressPhoto.create({
    data: { userId: auth.user.id, measurementId, pose, imageUrl: `private:${filename}` },
    select: { id: true, pose: true, createdAt: true },
  });
  return NextResponse.json({ photo: { ...photo, imageUrl: `/api/user/progress-photos/${photo.id}` } }, { status: 201 });
}
