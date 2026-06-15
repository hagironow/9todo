import type { Metadata, Viewport } from "next";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import MetaPixel from "@/components/analytics/MetaPixel";
import { LocaleProvider } from "@/i18n/context";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
};

export const metadata: Metadata = {
  verification: {
    google: "7N5HbE-Sw9_gEv-q9lTg68qB7LAz94UK527_QWzsrVg",
  },
  title: "9todo — 9칸 타임박스 플래너",
  description:
    "하루를 9칸에 담다. 아침·오후·저녁 × 3순위로 오늘 할 일을 배치하는 게임형 시간관리 앱.",
  keywords: [
    "타임박스",
    "시간관리",
    "할일관리",
    "플래너",
    "9todo",
    "timebox",
    "daily planner",
    "하루 계획",
    "투두리스트",
    "투두 앱",
    "루틴 관리",
    "루틴 트래커",
    "뽀모도로",
    "뽀모도로 타이머",
    "타이머 기록",
    "집중 타이머",
    "todo list",
    "routine tracker",
    "pomodoro timer",
    "생산성 앱",
    "productivity app",
    "시간표 앱",
    "우선순위 관리",
    "하루 루틴",
  ],
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "9todo",
  },
  openGraph: {
    title: "9todo — 9칸 타임박스 플래너",
    description:
      "하루를 9칸에 담다. 아침·오후·저녁 × 3순위로 오늘 할 일을 배치하는 게임형 시간관리 앱.",
    url: "https://9todo.app",
    siteName: "9todo",
    images: [
      {
        url: "/og_9todo.jpg",
        width: 1200,
        height: 630,
        alt: "9todo — 9칸 타임박스 플래너",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "9todo — 9칸 타임박스 플래너",
    description:
      "하루를 9칸에 담다. 아침·오후·저녁 × 3순위로 오늘 할 일을 배치하는 게임형 시간관리 앱.",
    images: ["/og_9todo.jpg"],
  },
  metadataBase: new URL("https://9todo.app"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').then(function(reg){reg.addEventListener('updatefound',function(){var nw=reg.installing;if(!nw)return;nw.addEventListener('statechange',function(){if(nw.state==='activated'&&navigator.serviceWorker.controller){location.reload()}})});document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')reg.update()})})}` }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.classList.add('dark')}catch(e){}})();
(function(){document.addEventListener('gesturestart',function(e){e.preventDefault()},{passive:false});document.addEventListener('gesturechange',function(e){e.preventDefault()},{passive:false});document.addEventListener('gestureend',function(e){e.preventDefault()},{passive:false});var last=0;document.addEventListener('touchend',function(e){var now=Date.now();if(now-last<300){e.preventDefault()}last=now},false)})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)]">
        <GoogleAnalytics />
        <MetaPixel />
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
