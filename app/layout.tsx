import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UIU Shuttle Admin",
  description: "Management dashboard for the UIU shuttle service",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
