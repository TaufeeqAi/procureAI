import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/app/globals.css";

/**
 * Fonts load via the `geist` npm package rather than `next/font/google`.
 * The package ships its font files locally — no network fetch at build
 * time — which is what broke Phase 0's font loader in restricted-egress
 * CI. It also happens to be the correct visual match for the reference
 * screenshot's Vercel-style dashboard typography.
 */
export const metadata: Metadata = {
  title: {
    default: "Elecon Procurement AI",
    template: "%s · Elecon Procurement AI",
  },
  description:
    "AI-assisted procurement intelligence and orchestration workspace for Elecon purchase officers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0c11",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
