import "server-only";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { hashPassword, type AppRole } from "@/lib/auth";
import { validateAccountInput, type AccountInput } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";

type AccountRelations = Pick<Prisma.UserCreateInput, "trainerProfile" | "trainerRelationships" | "gymStaffMemberships" | "gymMemberships">;

export function accountSearchWhere(query: string): Prisma.UserWhereInput {
  const identifier = query.toLowerCase();
  return { OR: [{ name: { contains: query } }, { username: { contains: identifier } }, { email: { contains: identifier } }] };
}

export function accountIdentifierWhere(identifier: string): { email: string } | { username: string } {
  return identifier.includes("@") ? { email: identifier } : { username: identifier };
}

export async function createAccount(input: AccountInput, role: AppRole, relations: AccountRelations = {}) {
  const { email, name, password, username } = input;
  return prisma.user.create({
    data: { email, name, username, password: await hashPassword(password), role, ...relations },
    select: { email: true, id: true, name: true, role: true, username: true },
  });
}

export function isAccountConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export function accountCreationError(error: unknown) {
  if (isAccountConflict(error)) {
    return NextResponse.json({ error: "این نام کاربری یا ایمیل قبلاً ثبت شده است." }, { status: 409 });
  }
  // Deployments that added only the username column can still require email.
  if (error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2011" && error.meta?.modelName === "User" && error.message.includes("(`email`)")) {
    return NextResponse.json({ error: "در نسخهٔ فعلی پایگاه داده، ایمیل برای ساخت حساب لازم است. یک ایمیل معتبر وارد کنید." }, { status: 400 });
  }
  console.error("Account creation failed:", error);
  return NextResponse.json({ error: "حساب ساخته نشد. دوباره تلاش کنید." }, { status: 500 });
}

export async function createManagedAccount(body: unknown, role: AppRole, relations: AccountRelations) {
  const validation = validateAccountInput(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  try {
    const account = await createAccount(validation.data, role, relations);
    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return accountCreationError(error);
  }
}
