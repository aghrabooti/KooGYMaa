import { beforeEach, describe, expect, it } from "vitest";
import {
  createDemoCheckoutToken,
  hashCheckoutToken,
  signWebhookPayload,
  verifyCheckoutToken,
  verifyWebhookSignature,
} from "@/lib/payments/provider";

beforeEach(() => {
  process.env.PAYMENT_WEBHOOK_SECRET = "test-webhook-secret-with-at-least-thirty-two-characters";
  process.env.PAYMENT_PROVIDER = "demo";
});

describe("payment security", () => {
  it("creates reproducible checkout tokens without storing plaintext", () => {
    const token = createDemoCheckoutToken("payment-1");
    expect(token).toBe(createDemoCheckoutToken("payment-1"));
    expect(token).not.toBe(createDemoCheckoutToken("payment-2"));
    expect(verifyCheckoutToken(token, hashCheckoutToken(token))).toBe(true);
    expect(verifyCheckoutToken(`${token}x`, hashCheckoutToken(token))).toBe(false);
  });

  it("verifies webhook signatures using the raw payload", () => {
    const payload = JSON.stringify({ eventId: "event-1", paymentId: "payment-1", type: "payment.succeeded" });
    const signature = signWebhookPayload(payload);
    expect(verifyWebhookSignature(payload, signature)).toBe(true);
    expect(verifyWebhookSignature(`${payload} `, signature)).toBe(false);
    expect(verifyWebhookSignature(payload, "bad-signature")).toBe(false);
  });
});
