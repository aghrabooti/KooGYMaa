import { NextResponse, type NextRequest } from "next/server";
import { readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { authorizeTrainerRequest } from "@/lib/trainer-access";

type Ctx = { params: Promise<{ photoId: string }> };

async function canView(viewerId: string, viewerRole: string, ownerId: string): Promise<boolean> {
  if (viewerId === ownerId) return true;
  if (viewerRole === "TRAINER") {
    const rel = await prisma.trainerClient.findFirst({ where: { userId: ownerId, status: "ACTIVE", trainer: { userId: viewerId } }, select: { id: true } });
    if (rel) return true;
  }
  if (viewerRole === "ADMIN") {
    const shared = await prisma.gymMembership.findFirst({ where: { userId: ownerId, status: "ACTIVE" }, select: { gymId: true } });
    if (!shared) return false;
    const staff = await prisma.gymStaff.findFirst({ where: { gymId: shared.gymId, userId: viewerId, status: "ACTIVE" }, select: { id: true } });
    return Boolean(staff);
  }
  return false;
}

function contentType(filename: string): string {
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".webp")) return "image/webp";
  if (filename.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

// GET → private file (owner, assigned trainer, or gym admin). Legacy http(s) URLs redirect.
export async function GET(request: NextRequest, { params }: Ctx) {
  const { photoId } = await params;
  const userAuth = await authorizeApiRequest(request, ["USER"]);
  const trainerAuth = userAuth.ok ? null : await authorizeTrainerRequest(request);
  const adminAuth = !userAuth.ok && !trainerAuth?.ok ? await (await import("@/lib/api-auth")).authorizeApiRequest(request, ["ADMIN"]) : null;
  const viewer = userAuth.ok ? { id: userAuth.user.id, role: "USER" }
    : trainerAuth?.ok ? { id: trainerAuth.access.user.id, role: "TRAINER" }
    : adminAuth?.ok ? { id: adminAuth.user.id, role: "ADMIN" } : null;
  if (!viewer) {
    const { NextResponse: NR } = await import("next/server");
    return NR.json({ error: "Authentication required." }, { status: 401 });
  }
  const photo = await prisma.progressPhoto.findUnique({ where: { id: photoId }, select: { id: true, userId: true, imageUrl: true } });
  if (!photo) return NextResponse.json({ error: "تصویر یافت نشد." }, { status: 404 });
  if (!(await canView(viewer.id, viewer.role, photo.userId))) {
    return NextResponse.json({ error: "دسترسی ندارید." }, { status: 403 });
  }
  if (/^https?:\/\//.test(photo.imageUrl)) return NextResponse.redirect(photo.imageUrl);
  const filename = photo.imageUrl.startsWith("private:") ? photo.imageUrl.slice(8) : photo.imageUrl;
  if (filename.includes("/") || filename.includes("\\")) return NextResponse.json({ error: "تصویر یافت نشد." }, { status: 404 });
  try {
    const bytes = await readFile(join(process.cwd(), "data", "uploads", photo.userId, filename));
    return new NextResponse(new Uint8Array(bytes), { headers: { "Content-Type": contentType(filename), "Cache-Control": "private, max-age=3600" } });
  } catch {
    return NextResponse.json({ error: "فایل تصویر یافت نشد." }, { status: 404 });
  }
}

// DELETE → owner removes their photo + file.
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const auth = await authorizeApiRequest(request, ["USER"]);
  if (!auth.ok) return auth.response;
  const { photoId } = await params;
  const photo = await prisma.progressPhoto.findFirst({ where: { id: photoId, userId: auth.user.id }, select: { id: true, userId: true, imageUrl: true } });
  if (!photo) return NextResponse.json({ error: "تصویر یافت نشد." }, { status: 404 });
  await prisma.progressPhoto.delete({ where: { id: photo.id } });
  if (photo.imageUrl.startsWith("private:")) {
    const filename = photo.imageUrl.slice(8);
    if (!filename.includes("/") && !filename.includes("\\")) {
      await unlink(join(process.cwd(), "data", "uploads", photo.userId, filename)).catch(() => undefined);
    }
  }
  return NextResponse.json({ ok: true });
}
