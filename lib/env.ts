import "server-only";

export type PaymentConfig = {
  appUrl: string;
  provider: string;
  webhookSecret: string;
};

export function getPaymentConfig(): PaymentConfig {
  const provider = (process.env.PAYMENT_PROVIDER || "demo").toLowerCase();
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || "development-webhook-secret-change-me";

  if (process.env.NODE_ENV === "production") {
    if (webhookSecret.length < 32) throw new Error("PAYMENT_WEBHOOK_SECRET must contain at least 32 characters in production.");
    if (provider === "demo" && process.env.ALLOW_DEMO_PAYMENTS !== "true") {
      throw new Error("Demo payments are disabled in production. Configure a real provider or explicitly set ALLOW_DEMO_PAYMENTS=true.");
    }
    if (!appUrl.startsWith("https://")) throw new Error("APP_URL must use HTTPS in production.");
  }

  return { appUrl, provider, webhookSecret };
}
