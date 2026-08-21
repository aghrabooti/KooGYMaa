import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "KooGYMaa — Move better. Manage smarter.",
    template: "%s | KooGYMaa",
  },
  description:
    "One powerful workspace for gyms, trainers, and members to manage training, progress, and community.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
