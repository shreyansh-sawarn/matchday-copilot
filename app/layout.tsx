import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MatchDay Copilot",
  description:
    "Your multilingual stadium guide for FIFA World Cup 2026 — directions, food, crowds and transport in your own language.",
  applicationName: "MatchDay Copilot",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1220",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        {children}
      </body>
    </html>
  );
}
