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

  // Demo project: the demo payment provider is allowed by default so the app
  // runs with no environment configuration. Set a real provider (and
  // ALLOW_DEMO_PAYMENTS=false) for production.
  const allowDemo = (process.env.ALLOW_DEMO_PAYMENTS ?? "true") === "true";

  if (process.env.NODE_ENV === "production") {
    if (provider !== "demo") {
      if (webhookSecret.length < 32) throw new Error("PAYMENT_WEBHOOK_SECRET must contain at least 32 characters in production.");
      if (!appUrl.startsWith("https://")) throw new Error("APP_URL must use HTTPS in production.");
    } else if (!allowDemo) {
      throw new Error("Demo payments are disabled in production. Configure a real provider or explicitly set ALLOW_DEMO_PAYMENTS=true.");
    }
  }

  return { appUrl, provider, webhookSecret };
}
