'use client';

import { useState, useEffect } from 'react';
import type { TimePeriod } from '@/lib/types';

function getCurrentPeriod(): TimePeriod {
  const hour = new Date().getHours();
  // 투두슬롯 타임: 새벽 5시가 하루 경계
  // 00:00~05:00 → 전날 밤 연장 (evening)
  if (hour < 5) return 'evening';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function useCurrentPeriod(): TimePeriod {
  const [period, setPeriod] = useState<TimePeriod>(getCurrentPeriod);

  useEffect(() => {
    const interval = setInterval(() => {
      setPeriod(getCurrentPeriod());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return period;
}
