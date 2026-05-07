'use client';

import { useState, useEffect } from 'react';
import { hasStorageConsent, grantStorageConsent } from '@/hooks/useAppData';

export default function StorageConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasStorageConsent()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    grantStorageConsent();
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] px-3 py-2.5 bg-[var(--card)] border-t border-[var(--border)] shadow-lg">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--foreground)] leading-snug">
          데이터는 서버에 저장되지 않습니다. 내보내기를 통해 수동 저장해 주세요.
        </p>
        <button
          onClick={handleAccept}
          className="flex-shrink-0 px-3 py-1 rounded-[var(--radius)] bg-[var(--foreground)] text-xs font-semibold hover:opacity-85 transition-opacity"
          style={{ color: 'var(--background)' }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
