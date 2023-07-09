import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Physika",
  description: "Physical Sandbox",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
