import type { NextConfig } from "next";

// Set PREVIEW_MODE=1 only for a local/live embedded preview (e.g. an iframe
// sandbox). Production deployments keep the strict clickjacking headers.
const isPreview = process.env.PREVIEW_MODE === "1";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  ...(isPreview ? [] : [{ key: "X-Frame-Options", value: "DENY" }]),
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: `default-src 'self'; base-uri 'self'; frame-ancestors ${isPreview ? "*" : "'none'"}; form-action 'self'; object-src 'none'; img-src 'self' https: data:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https:; upgrade-insecure-requests` },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(isPreview ? { allowedDevOrigins: ["*.e2b.app"] } : {}),
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
