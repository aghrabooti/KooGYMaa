import type { AppRole } from "@/lib/auth";

type ValidationSuccess<T> = { data: T; ok: true };
type ValidationFailure = { error: string; ok: false };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export type LoginInput = {
  email: string;
  password: string;
  remember: boolean;
};

export type RegisterInput = {
  email: string;
  name: string;
  password: string;
  role: Exclude<AppRole, "ADMIN">;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SELF_SERVICE_ROLES = new Set(["USER", "TRAINER"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function validateEmail(email: string) {
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

function validatePassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    Buffer.byteLength(password, "utf8") <= 72 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

export function validateLoginInput(value: unknown): ValidationResult<LoginInput> {
  if (!isRecord(value)) {
    return { error: "Invalid request body.", ok: false };
  }

  const email = normalizeEmail(value.email);
  const password = typeof value.password === "string" ? value.password : "";

  if (
    !validateEmail(email) ||
    !password ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return { error: "Enter a valid email and password.", ok: false };
  }

  return {
    data: {
      email,
      password,
      remember: value.remember === true,
    },
    ok: true,
  };
}

export function validateRegisterInput(value: unknown): ValidationResult<RegisterInput> {
  if (!isRecord(value)) {
    return { error: "Invalid request body.", ok: false };
  }

  const email = normalizeEmail(value.email);
  const name = normalizeName(value.name);
  const password = value.password;
  const role = value.role;

  if (name.length < 2 || name.length > 80) {
    return { error: "Name must be between 2 and 80 characters.", ok: false };
  }

  if (!validateEmail(email)) {
    return { error: "Enter a valid email address.", ok: false };
  }

  if (!validatePassword(password)) {
    return {
      error: "Password must be 8–72 characters and include a letter and a number.",
      ok: false,
    };
  }

  if (typeof role !== "string" || !SELF_SERVICE_ROLES.has(role)) {
    return { error: "Choose a valid account type.", ok: false };
  }

  return {
    data: {
      email,
      name,
      password,
      role: role as RegisterInput["role"],
    },
    ok: true,
  };
}
