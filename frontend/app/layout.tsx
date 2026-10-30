import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SSR Review | Readiness workspace",
  description:
    "Review your Self Study Report before submission. Identify criterion gaps, verify evidence, and plan your next steps.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
