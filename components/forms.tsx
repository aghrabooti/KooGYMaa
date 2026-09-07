"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/icon";

// Item 2: consistent, visible form errors (role=alert, icon, locale-ready).
export function FormError({ message, id }: { message?: string | null; id?: string }) {
  if (!message) return null;
  return (
    <p className="form-error" role="alert" id={id}>
      <Icon name="shield" size={14} />
      <span>{message}</span>
    </p>
  );
}

export function FormSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="form-success" role="status">
      <Icon name="check" size={14} />
      <span>{message}</span>
    </p>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && !error && <small className="field__hint">{hint}</small>}
      <FormError message={error} />
    </label>
  );
}
