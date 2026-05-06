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
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)]">{children}</body>
    </html>
  );
}
