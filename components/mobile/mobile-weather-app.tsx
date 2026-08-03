import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { toast } from 'sonner';
import { useAppContext } from '@/app/context/AppContext';
import MobileHomePage from './mobile-home-page';
import MobileNavigation from './mobile-navigation';
import MobileSearch from './mobile-search';
import type { MobileLabels, MobileView } from './mobile-types';

const MobileDailyPage = lazy(() => import('./mobile-daily-page'));
const MobileHourlyPage = lazy(() => import('./mobile-hourly-page'));
const MobileRadarPage = lazy(() => import('./mobile-radar-page'));
const MobileSettingsPage = lazy(() => import('./mobile-settings-page'));

const MOBILE_VIEWS: MobileView[] = ['home', 'hourly', 'daily', 'radar', 'settings'];
const SWIPE_DISTANCE = 54;
const SWIPE_MAX_VERTICAL = 72;

export default function MobileWeatherApp() {
  const locale = useLocale();
  const {
    weatherData,
    units,
    isLoading,
    isInitializing,
    error,
    refreshData,
    reportError,
    setApiStatus,
    setLocationByCoords,
    setLocationByName,
    setLocationBySuggestion,
    finishInitialization,
  } = useAppContext();
  const [activeView, setActiveView] = useState<MobileView>('home');
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('left');
  const swipeStart = useRef<{ x: number; y: number; ignore: boolean } | null>(null);
  const isGeolocatingRef = useRef(false);
  const labels = useMemo(() => getLabels(locale), [locale]);
  const t = useTranslations();

  const handleGeolocate = useCallback(async (isAuto = false) => {
    if (isGeolocatingRef.current) return;
    isGeolocatingRef.current = true;

    const requestLocation = async () => {
      if (Capacitor.isNativePlatform()) {
        const permissions = await Geolocation.requestPermissions();
        if (permissions.location !== 'granted') throw new Error('Location permission denied');
        return Geolocation.getCurrentPosition({ timeout: 10000, enableHighAccuracy: false });
      }

      if (!navigator.geolocation) throw new Error('Geolocation not supported');

      return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: false });
      });
    };

    toast.promise(requestLocation(), {
      loading: isAuto ? t('Toasts.gettingLocationAuto') : t('Toasts.gettingLocation'),
      success: (position) => {
        isGeolocatingRef.current = false;
        if (isAuto) finishInitialization();
        setApiStatus('geolocation', { status: 'operational' });
        reportError(null);
        setLocationByCoords(position.coords.latitude, position.coords.longitude);
        return t('Toasts.locationFound');
      },
      error: (error: Error | GeolocationPositionError) => {
        isGeolocatingRef.current = false;
        if (isAuto) finishInitialization();
        const isDenied = error.message.toLowerCase().includes('denied') || ('code' in error && error.code === 1);
        const isUnsupported = error.message.toLowerCase().includes('not supported');
        setApiStatus('geolocation', { status: 'outage' });
        if (!isAuto) {
          reportError({
            code: isDenied ? 'ERROR_GEOLOCATION_DENIED' : 'ERROR_GEOLOCATION_UNAVAILABLE',
            reason: isDenied ? 'permission' : isUnsupported ? 'unsupported' : 'unavailable',
            canRetry: !isUnsupported,
          });
        }
        return isDenied
          ? t('Toasts.locationDenied')
          : isAuto ? t('Toasts.locationErrorAuto') : t('Toasts.locationError');
      },
    });
  }, [finishInitialization, reportError, setApiStatus, setLocationByCoords, t]);

  useEffect(() => {
    if (isInitializing) handleGeolocate(true);
  }, [handleGeolocate, isInitializing]);

  const changeView = useCallback((nextView: MobileView) => {
    const currentIndex = MOBILE_VIEWS.indexOf(activeView);
    const nextIndex = MOBILE_VIEWS.indexOf(nextView);
    setTransitionDirection(nextIndex >= currentIndex ? 'left' : 'right');
    setActiveView(nextView);
  }, [activeView]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (!event.isPrimary) return;
    const target = event.target as HTMLElement;
    swipeStart.current = {
      x: event.clientX,
      y: event.clientY,
      ignore: Boolean(target.closest('input, textarea, select, [data-swipe-ignore="true"]')),
    };
  }, []);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || start.ignore || !event.isPrimary) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < SWIPE_DISTANCE || Math.abs(deltaY) > SWIPE_MAX_VERTICAL || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

    const currentIndex = MOBILE_VIEWS.indexOf(activeView);
    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < MOBILE_VIEWS.length) {
      changeView(MOBILE_VIEWS[nextIndex]);
    }
  }, [activeView, changeView]);

  let content;
  if (!weatherData) {
    const isFindingLocation = isInitializing && !error;
    content = (
      <div className="mobile-empty-state">
        <MobileSearch
          currentLocation=""
          labels={labels}
          onLocate={handleGeolocate}
          onSearch={setLocationByName}
          onSuggestion={setLocationBySuggestion}
        />
        {error ? <AlertTriangle /> : isFindingLocation ? <span className="mobile-loader" /> : <Search />}
        <h1>{error?.title || (isFindingLocation ? t('Metadata.title') : t('Weather.noLocationTitle'))}</h1>
        <p>{error?.message || (isFindingLocation ? t('Weather.findingLocalForecast') : t('Weather.noLocationDescription'))}</p>
        {error?.canRetry && (
          <button className="mobile-empty-state__retry" type="button" onClick={refreshData}>
            <RefreshCw /> {t('Errors.retry')}
          </button>
        )}
      </div>
    );
  } else if (activeView === 'hourly') {
    content = <MobileHourlyPage data={weatherData} labels={labels} onBack={() => changeView('home')} />;
  } else if (activeView === 'daily') {
    content = <MobileDailyPage data={weatherData} labels={labels} onBack={() => changeView('home')} />;
  } else if (activeView === 'radar') {
    content = <MobileRadarPage labels={labels} onBack={() => changeView('home')} />;
  } else if (activeView === 'settings') {
    content = <MobileSettingsPage labels={labels} onBack={() => changeView('home')} />;
  } else {
    content = (
      <MobileHomePage
        data={weatherData}
        labels={labels}
        units={units}
        onGeolocate={handleGeolocate}
        onSearch={setLocationByName}
        onSuggestion={setLocationBySuggestion}
      />
    );
  }

  return (
    <div className="mobile-weather-app">
      <main
        className="mobile-weather-app__content"
        aria-busy={isLoading}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { swipeStart.current = null; }}
      >
        <div className="mobile-page-transition" data-direction={transitionDirection} key={activeView}>
          <Suspense fallback={<div className="mobile-empty-state" aria-busy="true"><span className="mobile-loader" /></div>}>
            {content}
          </Suspense>
        </div>
      </main>
      <MobileNavigation activeView={activeView} labels={labels} onChange={changeView} />
    </div>
  );
}

function getLabels(locale: string): MobileLabels {
  if (locale.startsWith('fr')) {
    return {
      back: 'Retour',
      daily: 'Quotidien',
      home: 'Accueil',
      hourly: 'Horaire',
      locate: 'Ma position',
      radar: 'Radar',
      rain: 'Pluie',
      search: 'Rechercher un lieu…',
      settings: 'Réglages',
      temperature: 'Température',
    };
  }

  return {
    back: 'Back',
    daily: 'Daily',
    home: 'Home',
    hourly: 'Hourly',
    locate: 'My location',
    radar: 'Radar',
    rain: 'Rain',
    search: 'Search a location…',
    settings: 'Settings',
    temperature: 'Temperature',
  };
}
