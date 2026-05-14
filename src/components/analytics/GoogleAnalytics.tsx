'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { trackReturnVisit } from '@/lib/analytics';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GoogleAnalytics() {
  const [isAdmin, setIsAdmin] = useState(true); // default true to prevent flash-load

  useEffect(() => {
    const admin = localStorage.getItem('9todo_admin') === 'true';
    setIsAdmin(admin);
    if (!admin) {
      trackReturnVisit();
    }
  }, []);

  if (!GA_ID || isAdmin) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            user_language: localStorage.getItem('9todo_locale') || navigator.language,
          });
        `}
      </Script>
    </>
  );
}
