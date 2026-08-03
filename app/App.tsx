import { lazy, Suspense } from 'react';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AppProvider } from '@/app/context/AppContext';
import { LanguageProvider } from '@/app/context/LanguageProvider';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Locale, routing } from '@/i18n-config';
import enMessages from '@/messages/en.json';
import frMessages from '@/messages/fr.json';

const DesktopWeatherApp = lazy(() => import('@/components/layout/desktop-weather-app'));
const MobileWeatherApp = lazy(() => import('@/components/mobile/mobile-weather-app'));

const allMessages = {
  en: enMessages,
  fr: frMessages,
};

export default function App() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isMobile = useMediaQuery('(max-width: 49.999rem)');

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
          <Suspense fallback={<div className="h-dvh w-full bg-background" aria-busy="true" />}>
            {isMobile ? <MobileWeatherApp /> : <DesktopWeatherApp />}
          </Suspense>
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
