type Success<T> = { data: T; ok: true };
type Failure = { error: string; ok: false };
type Result<T> = Success<T> | Failure;

type GymStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
type MembershipStatus = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "EXPIRED" | "CANCELLED";
type SubscriptionStatus = "PENDING" | "ACTIVE" | "PAST_DUE" | "EXPIRED" | "CANCELLED";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function nullableText(value: unknown, max: number) {
  const normalized = text(value, max);
  return normalized || null;
}

function numberValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return Number.NaN;
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export function validateGymInput(value: unknown, partial = false): Result<{
  address?: string | null;
  city?: string | null;
  country?: string;
  description?: string | null;
  email?: string | null;
  name?: string;
  phone?: string | null;
  slug?: string;
  status?: GymStatus;
}> {
  if (!isRecord(value)) return { error: "Invalid request body.", ok: false };

  const name = text(value.name, 100);
  const requestedSlug = text(value.slug, 80);
  const email = nullableText(value.email, 254);
  const status = value.status;
  const allowedStatuses = new Set(["DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED"]);

  if (!partial && name.length < 2) {
    return { error: "Gym name must contain at least 2 characters.", ok: false };
  }

  if (value.name !== undefined && name.length < 2) {
    return { error: "Gym name must contain at least 2 characters.", ok: false };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid gym email address.", ok: false };
  }

  if (status !== undefined && (typeof status !== "string" || !allowedStatuses.has(status))) {
    return { error: "Choose a valid gym status.", ok: false };
  }

  const data = {
    ...(value.name !== undefined || !partial ? { name } : {}),
    ...(value.slug !== undefined || !partial
      ? { slug: slugify(requestedSlug || name) }
      : {}),
    ...(value.description !== undefined ? { description: nullableText(value.description, 1_000) } : {}),
    ...(value.email !== undefined ? { email } : {}),
    ...(value.phone !== undefined ? { phone: nullableText(value.phone, 40) } : {}),
    ...(value.address !== undefined ? { address: nullableText(value.address, 300) } : {}),
    ...(value.city !== undefined ? { city: nullableText(value.city, 100) } : {}),
    ...(value.country !== undefined ? { country: text(value.country, 2).toUpperCase() || "IR" } : {}),
    ...(status !== undefined ? { status: status as GymStatus } : {}),
  };

  if (!partial && !data.slug) {
    return { error: "Gym name must produce a valid URL slug.", ok: false };
  }

  if (partial && Object.keys(data).length === 0) {
    return { error: "Provide at least one field to update.", ok: false };
  }

  return { data, ok: true };
}

export function validateMembershipDecision(value: unknown): Result<{
  expiresAt?: Date | null;
  status: MembershipStatus;
}> {
  if (!isRecord(value)) return { error: "Invalid request body.", ok: false };

  const statuses = new Set(["PENDING", "ACTIVE", "REJECTED", "SUSPENDED", "EXPIRED", "CANCELLED"]);
  if (typeof value.status !== "string" || !statuses.has(value.status)) {
    return { error: "Choose a valid membership status.", ok: false };
  }

  let expiresAt: Date | null | undefined;
  if (value.expiresAt === null) {
    expiresAt = null;
  } else if (typeof value.expiresAt === "string" && value.expiresAt) {
    expiresAt = new Date(value.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      return { error: "Enter a valid expiration date.", ok: false };
    }
  }

  return {
    data: {
      ...(expiresAt !== undefined ? { expiresAt } : {}),
      status: value.status as MembershipStatus,
    },
    ok: true,
  };
}

export function validatePlanInput(value: unknown, partial = false): Result<{
  audience?: "MEMBER" | "TRAINER";
  currency?: string;
  description?: string | null;
  durationDays?: number;
  isActive?: boolean;
  name?: string;
  price?: number;
}> {
  if (!isRecord(value)) return { error: "Invalid request body.", ok: false };

  const name = text(value.name, 80);
  const price = numberValue(value.price);
  const durationDays = numberValue(value.durationDays);
  const audience = value.audience;

  if ((!partial || value.name !== undefined) && name.length < 2) {
    return { error: "Plan name must contain at least 2 characters.", ok: false };
  }
  if ((!partial || value.price !== undefined) && (!Number.isSafeInteger(price) || price < 0)) {
    return { error: "Price must be a non-negative whole number.", ok: false };
  }
  if ((!partial || value.durationDays !== undefined) && (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 730)) {
    return { error: "Duration must be between 1 and 730 days.", ok: false };
  }
  if ((!partial || value.audience !== undefined) && audience !== "MEMBER" && audience !== "TRAINER") {
    return { error: "Choose a valid plan audience.", ok: false };
  }
  if (value.isActive !== undefined && typeof value.isActive !== "boolean") {
    return { error: "Plan availability must be true or false.", ok: false };
  }

  const data = {
    ...(value.name !== undefined || !partial ? { name } : {}),
    ...(value.description !== undefined ? { description: nullableText(value.description, 500) } : {}),
    ...(value.audience !== undefined || !partial ? { audience: audience as "MEMBER" | "TRAINER" } : {}),
    ...(value.price !== undefined || !partial ? { price } : {}),
    ...(value.currency !== undefined || !partial ? { currency: text(value.currency, 3).toUpperCase() || "IRR" } : {}),
    ...(value.durationDays !== undefined || !partial ? { durationDays } : {}),
    ...(value.isActive !== undefined ? { isActive: value.isActive } : {}),
  };

  if (partial && Object.keys(data).length === 0) {
    return { error: "Provide at least one field to update.", ok: false };
  }

  return { data, ok: true };
}

export function validateSubscriptionCreate(value: unknown): Result<{
  autoRenew: boolean;
  planId: string;
  subscriberEmail: string;
}> {
  if (!isRecord(value)) return { error: "Invalid request body.", ok: false };

  const subscriberEmail = text(value.subscriberEmail, 254).toLowerCase();
  const planId = text(value.planId, 100);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subscriberEmail)) {
    return { error: "Enter a valid subscriber email.", ok: false };
  }
  if (!planId) return { error: "Choose a subscription plan.", ok: false };

  return {
    data: {
      autoRenew: value.autoRenew === true,
      planId,
      subscriberEmail,
    },
    ok: true,
  };
}

export function validateSubscriptionUpdate(value: unknown): Result<{
  autoRenew?: boolean;
  extendDays?: number;
  status?: SubscriptionStatus;
}> {
  if (!isRecord(value)) return { error: "Invalid request body.", ok: false };

  const statuses = new Set(["PENDING", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED"]);
  const status = value.status;
  const extendDays = value.extendDays === undefined ? undefined : numberValue(value.extendDays);

  if (status !== undefined && (typeof status !== "string" || !statuses.has(status))) {
    return { error: "Choose a valid subscription status.", ok: false };
  }
  if (extendDays !== undefined && (!Number.isInteger(extendDays) || extendDays < 1 || extendDays > 730)) {
    return { error: "Extension must be between 1 and 730 days.", ok: false };
  }
  if (value.autoRenew !== undefined && typeof value.autoRenew !== "boolean") {
    return { error: "Auto-renew must be true or false.", ok: false };
  }
  if (status === undefined && extendDays === undefined && value.autoRenew === undefined) {
    return { error: "Provide at least one subscription change.", ok: false };
  }

  return {
    data: {
      ...(status !== undefined ? { status: status as SubscriptionStatus } : {}),
      ...(extendDays !== undefined ? { extendDays } : {}),
      ...(value.autoRenew !== undefined ? { autoRenew: value.autoRenew } : {}),
    },
    ok: true,
  };
}
