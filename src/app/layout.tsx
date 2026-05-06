import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "todoslot",
  description: "오늘의 시간 배분 — 9칸 시간표",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
