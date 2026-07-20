// app/context/LanguageProvider.tsx
import { createContext, useEffect, useState, useContext, ReactNode } from 'react';
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { Locale } from '@/i18n-config';
import { Messages } from '@/lib/types';

interface AllMessages {
  [key: string]: AbstractIntlMessages;
}

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = 'weather-language';

interface LanguageProviderProps {
  children: ReactNode;
  initialLocale: Locale;
  allMessages: AllMessages;
  timeZone: string;
}

export const LanguageProvider = ({ children, initialLocale, allMessages, timeZone }: LanguageProviderProps) => {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === 'undefined') return initialLocale;

    const savedLocale = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLocale && savedLocale in allMessages ? savedLocale as Locale : initialLocale;
  });

  const messages = allMessages[locale];

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;

    const metadata = (messages as Messages).Metadata;
    if (metadata?.title) {
      document.title = metadata.title;
    }

    if (metadata?.description) {
      let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!description) {
        description = document.createElement('meta');
        description.name = 'description';
        document.head.append(description);
      }
      description.content = metadata.description;
    }
  }, [locale, messages]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider 
        locale={locale} 
        messages={messages} 
        timeZone={timeZone}
        key={locale}
      >
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
