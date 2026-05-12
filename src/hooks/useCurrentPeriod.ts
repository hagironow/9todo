'use client';

import { useState, useEffect } from 'react';
import type { TimePeriod } from '@/lib/types';
import { hourToPeriod } from '@/lib/periods';

function getCurrentPeriod(): TimePeriod {
  return hourToPeriod(new Date().getHours());
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
