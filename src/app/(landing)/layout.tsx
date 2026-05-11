import type { Metadata } from "next";
import "@/styles/landing-tokens.css";

export const metadata: Metadata = {
  title: "하루를 9개의 타임박스로 설계하세요 — 9todo",
  description:
    "우선순위를 강제하는 타임박스 플래너. 투두와 루틴을 한눈에, 뽀모도로 타이머, 퀵 메모, 목표 세우기와 회고. 무료, 로컬 저장, 오픈소스.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "9todo",
    title: "하루를 9개의 타임박스로 설계하세요 — 9todo",
    description:
      "우선순위를 강제하는 타임박스 플래너. 투두와 루틴을 한눈에, 뽀모도로 타이머, 퀵 메모, 목표 세우기와 회고.",
    url: "https://9todo.app/",
    images: [
      {
        url: "https://9todo.app/og_9todo.jpg",
        width: 1200,
        height: 630,
        alt: "9todo — 하루를 9개의 타임박스로 설계하는 생산성 앱",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "하루를 9개의 타임박스로 설계하세요 — 9todo",
    description:
      "우선순위를 강제하는 타임박스 플래너. 투두와 루틴을 한눈에, 뽀모도로 타이머, 퀵 메모, 목표 세우기와 회고.",
    images: ["https://9todo.app/og_9todo.jpg"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="landing-layout" className="landing">
      {children}
    </div>
  );
}
