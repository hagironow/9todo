import type { Metadata } from "next";
import "@/styles/landing-tokens.css";

export const metadata: Metadata = {
  title: "9todo — 멀티태스커를 위한 타임박스 플래너",
  description:
    "하루 9칸, 제약이 만드는 우선순위. 할 일을 시간에 넣는 것만으로 집중력이 달라집니다. 가입 없이 바로 시작하세요.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "9todo",
    title: "9todo — 멀티태스커를 위한 타임박스 플래너",
    description:
      "하루 9칸, 제약이 만드는 우선순위. 할 일을 시간에 넣는 것만으로 집중력이 달라집니다.",
    url: "https://9todo.app/",
    images: [
      {
        url: "https://9todo.app/og_9todo.jpg",
        width: 1200,
        height: 630,
        alt: "9todo — 멀티태스커를 위한 타임박스 플래너",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "9todo — 멀티태스커를 위한 타임박스 플래너",
    description:
      "하루 9칸, 제약이 만드는 우선순위. 할 일을 시간에 넣는 것만으로 집중력이 달라집니다.",
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
