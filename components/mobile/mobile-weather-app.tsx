import { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { toast } from 'sonner';
import { useAppContext } from '@/app/context/AppContext';
import MobileDailyPage from './mobile-daily-page';
import MobileHomePage from './mobile-home-page';
import MobileHourlyPage from './mobile-hourly-page';
import MobileNavigation from './mobile-navigation';
import MobileRadarPage from './mobile-radar-page';
import MobileSearch from './mobile-search';
import MobileSettingsPage from './mobile-settings-page';
import type { MobileLabels, MobileView } from './mobile-types';

export default function MobileWeatherApp() {
  const locale = useLocale();
  const {
    weatherData,
    units,
    isLoading,
    error,
    refreshData,
    reportError,
    setApiStatus,
    setLocationByCoords,
    setLocationByName,
    setLocationBySuggestion,
  } = useAppContext();
  const [activeView, setActiveView] = useState<MobileView>('home');
  const labels = useMemo(() => getLabels(locale), [locale]);
  const t = useTranslations();

  const handleGeolocate = useCallback(async () => {
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
      loading: t('Toasts.gettingLocation'),
      success: (position) => {
        setApiStatus('geolocation', { status: 'operational' });
        reportError(null);
        setLocationByCoords(position.coords.latitude, position.coords.longitude);
        return t('Toasts.locationFound');
      },
      error: (error: Error | GeolocationPositionError) => {
        const isDenied = error.message.toLowerCase().includes('denied') || ('code' in error && error.code === 1);
        const isUnsupported = error.message.toLowerCase().includes('not supported');
        setApiStatus('geolocation', { status: 'outage' });
        reportError({
          code: isDenied ? 'ERROR_GEOLOCATION_DENIED' : 'ERROR_GEOLOCATION_UNAVAILABLE',
          reason: isDenied ? 'permission' : isUnsupported ? 'unsupported' : 'unavailable',
          canRetry: !isUnsupported,
        });
        return isDenied ? t('Toasts.locationDenied') : t('Toasts.locationError');
      },
    });
  }, [reportError, setApiStatus, setLocationByCoords, t]);

  let content;
  if (!weatherData) {
    content = (
      <div className="mobile-empty-state">
        <MobileSearch
          currentLocation=""
          labels={labels}
          onLocate={handleGeolocate}
          onSearch={setLocationByName}
          onSuggestion={setLocationBySuggestion}
        />
        {error ? <AlertTriangle /> : <span className="mobile-loader" />}
        <h1>{error?.title || 'Weather'}</h1>
        <p>{error?.message || 'Finding your local forecast…'}</p>
        {error?.canRetry && (
          <button className="mobile-empty-state__retry" type="button" onClick={refreshData}>
            <RefreshCw /> Retry
          </button>
        )}
      </div>
    );
  } else if (activeView === 'hourly') {
    content = <MobileHourlyPage data={weatherData} labels={labels} onBack={() => setActiveView('home')} />;
  } else if (activeView === 'daily') {
    content = <MobileDailyPage data={weatherData} labels={labels} onBack={() => setActiveView('home')} />;
  } else if (activeView === 'radar') {
    content = <MobileRadarPage labels={labels} onBack={() => setActiveView('home')} />;
  } else if (activeView === 'settings') {
    content = <MobileSettingsPage labels={labels} onBack={() => setActiveView('home')} />;
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
      <main className="mobile-weather-app__content" aria-busy={isLoading}>
        {content}
      </main>
      <MobileNavigation activeView={activeView} labels={labels} onChange={setActiveView} />
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
