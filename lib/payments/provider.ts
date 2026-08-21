import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getPaymentConfig } from "@/lib/env";

export type CheckoutRequest = {
  amount: number;
  currency: string;
  paymentId: string;
  description: string;
};

export type CheckoutResult = {
  checkoutTokenHash: string;
  checkoutUrl: string;
  provider: string;
  providerReference: string;
};

export interface PaymentProvider {
  createCheckout(request: CheckoutRequest): Promise<CheckoutResult>;
}

class DemoPaymentProvider implements PaymentProvider {
  async createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
    const token = createDemoCheckoutToken(request.paymentId);
    return {
      provider: "demo",
      providerReference: `demo_${request.paymentId}`,
      checkoutTokenHash: hashCheckoutToken(token),
      checkoutUrl: `/user/checkout/${request.paymentId}?token=${encodeURIComponent(token)}`,
    };
  }
}

export function createDemoCheckoutToken(paymentId: string) {
  return createHmac("sha256", getPaymentConfig().webhookSecret).update(`checkout:${paymentId}`).digest("base64url");
}

export function demoCheckoutUrl(paymentId: string) {
  return `/user/checkout/${paymentId}?token=${encodeURIComponent(createDemoCheckoutToken(paymentId))}`;
}

export function hashCheckoutToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyCheckoutToken(token: string, expectedHash: string | null) {
  if (!token || !expectedHash) return false;
  const actual = Buffer.from(hashCheckoutToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function signWebhookPayload(payload: string, secret = getPaymentConfig().webhookSecret) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyWebhookSignature(payload: string, signature: string | null, secret = getPaymentConfig().webhookSecret) {
  if (!signature) return false;
  const actual = Buffer.from(signWebhookPayload(payload, secret), "hex");
  let provided: Buffer;
  try { provided = Buffer.from(signature, "hex"); } catch { return false; }
  return actual.length === provided.length && timingSafeEqual(actual, provided);
}

export function getPaymentProvider(): PaymentProvider {
  const { provider } = getPaymentConfig();
  if (provider === "demo") return new DemoPaymentProvider();
  throw new Error(`Payment provider '${provider}' is not installed. Add its adapter before enabling it.`);
}
