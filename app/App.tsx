import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AppProvider } from '@/app/context/AppContext';
import { LanguageProvider } from '@/app/context/LanguageProvider';
import TopBar from '@/components/layout/top-bar';
import HomePage from '@/app/HomePage';
import MobileWeatherApp from '@/components/mobile/mobile-weather-app';
import { Locale, routing } from '@/i18n-config';
import enMessages from '@/messages/en.json';
import frMessages from '@/messages/fr.json';

const allMessages = {
  en: enMessages,
  fr: frMessages,
};
const ACTIVE_VIEW_STORAGE_KEY = 'weather-active-view';

export default function App() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [activeView, setActiveView] = useState<'weather' | 'radar'>(() => {
    if (typeof window === 'undefined') return 'weather';

    return window.localStorage.getItem(ACTIVE_VIEW_STORAGE_KEY) === 'radar' ? 'radar' : 'weather';
  });

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, activeView);
  }, [activeView]);

  return (
    <LanguageProvider
      initialLocale={routing.defaultLocale as Locale}
      allMessages={allMessages}
      timeZone={timeZone}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        storageKey="weather-theme"
        enableSystem
        disableTransitionOnChange
      >
        <AppProvider>
          <div className="desktop-weather-app">
            <div className="weather-shell mx-auto grid h-dvh max-h-dvh w-full max-w-[98rem] grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden p-2 sm:p-3">
              <TopBar activeView={activeView} onViewChange={setActiveView} />
              <HomePage activeView={activeView} />
            </div>
          </div>
          <MobileWeatherApp />
        </AppProvider>
        <Toaster
          richColors
          mobileOffset={{
            bottom: 'calc(4.75rem + env(safe-area-inset-bottom))',
            left: '0.75rem',
            right: '0.75rem',
          }}
        />
      </ThemeProvider>
    </LanguageProvider>
  );
}
