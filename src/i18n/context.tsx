'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import ko, { type Translations } from './ko';
import en from './en';

export type Locale = 'ko' | 'en';

const STORAGE_KEY = '9todo_locale';

const translations: Record<Locale, Translations> = { ko, en };

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: en,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === 'ko' || stored === 'en')) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    } else {
      const browserLocale: Locale = navigator.language.startsWith('ko') ? 'ko' : 'en';
      setLocaleState(browserLocale);
      document.documentElement.lang = browserLocale;
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
