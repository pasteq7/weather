// app/context/AppContext.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { WeatherData, ApiIssueKey } from '@/lib/types';
import { fetchWeatherByCity, fetchWeatherData, getCityNameFromCoordinates, WeatherApiError } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { MeteoconStyle } from '@/lib/meteocons';
import { hasValidCoordinates, LOCATION_STORAGE_KEY, readSavedLocation, readFavorites, resolveLegacyFavorite,
  FAVORITES_STORAGE_KEY, FAVORITES_CHANGED_EVENT } from '@/lib/location-preferences';
import { startRefreshScheduler } from '@/lib/refresh-scheduler';

export type ApiStatusValue = 'operational' | 'partial' | 'outage' | 'pending';

export interface ApiStatus {
  status: ApiStatusValue;
  issues?: ApiIssueKey[];
}

interface ApiStatuses {
  openMeteo: ApiStatus;
  reverseGeo: ApiStatus;
  geolocation: ApiStatus;
  windy: ApiStatus;
}

interface Location {
  lat: number | null;
  lon: number | null;
  name: string | null;
}

export type AppErrorSource = 'weather' | 'geocoding' | 'reverseGeo' | 'geolocation' | 'unknown';
export type AppErrorReason = 'network' | 'http' | 'parse' | 'schema' | 'notFound' | 'permission' | 'unavailable' | 'unsupported' | 'missingLocation' | 'unknown';

export interface AppError {
  source: AppErrorSource;
  title: string;
  message: string;
  detail: string;
  code: string;
  reason: AppErrorReason;
  target?: string;
  status?: number;
  canRetry: boolean;
  occurredAt: number;
}

type AppErrorInput = AppError | {
  code: string;
  source?: AppErrorSource;
  target?: string;
  status?: number;
  reason?: AppErrorReason;
  message?: string;
  title?: string;
  detail?: string;
  canRetry?: boolean;
} | null;

interface AppContextType {
  location: Location;
  units: 'metric' | 'imperial';
  weatherUnits: 'metric' | 'imperial';
  iconStyle: MeteoconStyle;
  weatherData: WeatherData | null;
  lastUpdatedAt: number | null;
  isLoading: boolean;
  error: AppError | null;
  isInitializing: boolean;
  apiStatus: ApiStatuses;
  setUnits: (units: 'metric' | 'imperial') => void;
  setIconStyle: (style: MeteoconStyle) => void;
  setLocationByName: (name: string) => void;
  setLocationBySuggestion: (location: { name: string; lat: number; lon: number }) => void;
  setLocationByCoords: (lat: number, lon: number, onlyIfUnset?: boolean) => void;
  refreshData: () => void;
  refreshDataSilently: () => void;
  finishInitialization: () => void;
  setApiStatus: (service: keyof ApiStatuses, status: ApiStatus) => void;
  reportError: (error: AppErrorInput) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const hasCoordinates = (location: Location) => location.lat !== null && location.lon !== null;
const areIssuesEqual = (left?: ApiIssueKey[], right?: ApiIssueKey[]) => (
  left === right || (
    left?.length === right?.length && left?.every((issue, index) => issue === right?.[index])
  )
);
const ICON_STYLE_STORAGE_KEY = 'weather-icon-style';
const UNITS_STORAGE_KEY = 'weather-units';
const NON_RETRYABLE_ERROR_CODES = new Set(['ERROR_CITY_NOT_FOUND', 'ERROR_GEOLOCATION_DENIED', 'ERROR_NO_LOCATION']);

const ERROR_SOURCE_BY_CODE: Record<string, AppErrorSource> = {
  ERROR_FETCH_COORDINATES: 'geocoding',
  ERROR_CITY_NOT_FOUND: 'geocoding',
  ERROR_FETCH_WEATHER: 'weather',
  ERROR_INVALID_RESPONSE: 'weather',
  ERROR_INVALID_WEATHER_DATA: 'weather',
  ERROR_REVERSE_GEOCODING: 'reverseGeo',
  ERROR_GEOLOCATION_DENIED: 'geolocation',
  ERROR_GEOLOCATION_UNAVAILABLE: 'geolocation',
  ERROR_NO_LOCATION: 'unknown',
  ERROR_UNKNOWN: 'unknown',
};

const getInitialIconStyle = (): MeteoconStyle => {
  if (typeof window === 'undefined') return 'line';

  const savedStyle = window.localStorage.getItem(ICON_STYLE_STORAGE_KEY);
  return savedStyle === 'fill' || savedStyle === 'monochrome' ? savedStyle : 'line';
};

const getInitialUnits = (): 'metric' | 'imperial' => {
  if (typeof window === 'undefined') return 'metric';

  return window.localStorage.getItem(UNITS_STORAGE_KEY) === 'imperial' ? 'imperial' : 'metric';
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const t = useTranslations();
  const [location, setLocation] = useState<Location>(() => readSavedLocation() ?? { lat: null, lon: null, name: null });
  const [units, setUnits] = useState<'metric' | 'imperial'>(getInitialUnits);
  const [weatherUnits, setWeatherUnits] = useState<'metric' | 'imperial'>(units);
  const [iconStyle, setIconStyleState] = useState<MeteoconStyle>(getInitialIconStyle);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [isInitializing, setIsInitializing] = useState(() => !location.name && !hasCoordinates(location));
  const [apiStatus, setApiStatusState] = useState<ApiStatuses>({
    openMeteo: { status: 'operational' },
    reverseGeo: { status: 'operational' },
    geolocation: { status: 'pending' },
    windy: { status: 'pending' },
  });
  
  const activeFetchIdRef = useRef(0);
  const activeFetchControllerRef = useRef<AbortController | null>(null);
  const lastAttemptRef = useRef(Date.now());
  const resolvedLocationRef = useRef<{ request: Location; resolved: Location } | null>(null);

  const setApiStatus = useCallback((service: keyof ApiStatuses, status: ApiStatus) => {
    setApiStatusState(prev => {
      const currentStatus = prev[service];
      if (currentStatus.status === status.status && areIssuesEqual(currentStatus.issues, status.issues)) {
        return prev;
      }
      return { ...prev, [service]: status };
    });
  }, []);

  const buildAppError = useCallback((input: Exclude<AppErrorInput, null>): AppError => {
    if ('occurredAt' in input) {
      return input;
    }

    const code = input.code.startsWith('ERROR_') ? input.code : 'ERROR_UNKNOWN';
    const source = input.source ?? ERROR_SOURCE_BY_CODE[code] ?? 'unknown';
    const reason = input.reason ?? 'unknown';
    const sourceLabel = t(`Errors.source.${source}`);
    const reasonLabel = t(`Errors.reason.${reason}`);
    const translatedMessage = t(`Errors.${code}`);
    const message = input.message ?? (
      translatedMessage === `Errors.${code}` ? t('Errors.ERROR_UNKNOWN') : translatedMessage
    );
    const title = input.title ?? t('Errors.failedSourceTitle', { service: sourceLabel });
    const detail = input.detail ?? t(input.target ? 'Errors.detailWithTarget' : 'Errors.detail', {
      service: sourceLabel,
      reason: reasonLabel,
      target: input.target ?? '',
      code,
      status: input.status ?? t('Errors.notAvailable'),
    });

    return {
      source,
      title,
      message,
      detail,
      code,
      reason,
      target: input.target,
      status: input.status,
      canRetry: input.canRetry ?? !NON_RETRYABLE_ERROR_CODES.has(code),
      occurredAt: Date.now(),
    };
  }, [t]);

  const reportError = useCallback((nextError: AppErrorInput) => {
    setError(nextError ? buildAppError(nextError) : null);
  }, [buildAppError]);

  const setIconStyle = useCallback((style: MeteoconStyle) => {
    setIconStyleState(style);
    window.localStorage.setItem(ICON_STYLE_STORAGE_KEY, style);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(UNITS_STORAGE_KEY, units);
  }, [units]);

  const finishInitialization = useCallback(() => {
    setIsInitializing(false);
  }, []);

  const fetchAndSetWeather = useCallback(async (currentLocation: Location, currentUnits: 'metric' | 'imperial') => {
    if (!currentLocation.name && !hasCoordinates(currentLocation)) {
      setIsLoading(false);
      setError(null);
      setWeatherData(null);
      return;
    }

    const fetchId = activeFetchIdRef.current + 1;
    activeFetchIdRef.current = fetchId;
    activeFetchControllerRef.current?.abort();
    const controller = new AbortController();
    activeFetchControllerRef.current = controller;
    lastAttemptRef.current = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto';
      let data: WeatherData;
      const resolvedLocation = resolvedLocationRef.current?.request === currentLocation
        ? resolvedLocationRef.current.resolved : currentLocation;
      let name = resolvedLocation.name;
      let lat = resolvedLocation.lat;
      let lon = resolvedLocation.lon;
      let nonBlockingError: AppError | null = null;

      if (lat !== null && lon !== null) {
        data = await fetchWeatherData(lat, lon, currentUnits, clientTimezone, controller.signal);
        
        if (!name) {
          const geoResult = await getCityNameFromCoordinates(lat, lon, controller.signal);
          setApiStatus('reverseGeo', { status: geoResult.ok ? 'operational' : 'outage' });
          if (!geoResult.ok) {
            nonBlockingError = buildAppError({
              code: 'ERROR_REVERSE_GEOCODING',
              source: 'reverseGeo',
              target: t('Weather.currentLocation'),
              reason: 'unavailable',
              canRetry: true,
            });
          }
          name = geoResult.name || t('Weather.currentLocation');
        }
      } else if (name) {
        const result = await fetchWeatherByCity(name, currentUnits, clientTimezone, controller.signal);
        setApiStatus('reverseGeo', { status: 'operational' });
        data = result;
        name = result.name || name;
        lat = result.latitude;
        lon = result.longitude;
      } else {
        throw new WeatherApiError('ERROR_NO_LOCATION', { reason: 'missingLocation' });
      }
      
      const completeWeatherData = { ...data, name, latitude: lat ?? undefined, longitude: lon ?? undefined };
      if (fetchId !== activeFetchIdRef.current) return;

      setWeatherData(completeWeatherData);
      setWeatherUnits(currentUnits);
      setLastUpdatedAt(Date.now());
      const savedLocation = { name, lat, lon };
      const reusableLocation = nonBlockingError ? { ...savedLocation, name: null } : savedLocation;
      resolvedLocationRef.current = { request: currentLocation, resolved: reusableLocation };
      try {
        window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(reusableLocation));
        const favorites = readFavorites();
        if (favorites.some((item) => item.lat === null && item.name === currentLocation.name)) {
          window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(resolveLegacyFavorite(favorites, currentLocation.name, savedLocation)));
          window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
        }
      } catch {
        // Weather remains usable when browser storage is unavailable.
      }
      setError(nonBlockingError);

      setApiStatus('openMeteo', { status: 'operational' });

    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      if (fetchId !== activeFetchIdRef.current) return;

      const weatherError = e instanceof WeatherApiError ? e : null;
      const errorCode = weatherError?.code ?? (e instanceof Error ? e.message : 'ERROR_UNKNOWN');
      const errorSource = weatherError?.service ?? ERROR_SOURCE_BY_CODE[errorCode] ?? 'unknown';
      const target = currentLocation.name ?? (hasCoordinates(currentLocation) ? t('Weather.currentLocation') : undefined);

      if (errorSource === 'geocoding' && errorCode === 'ERROR_FETCH_COORDINATES') {
        setApiStatus('reverseGeo', { status: 'outage' });
      } else if (errorSource === 'geocoding' && errorCode === 'ERROR_CITY_NOT_FOUND') {
        setApiStatus('reverseGeo', { status: 'operational' });
      } else if (errorSource === 'weather') {
        setApiStatus('openMeteo', { status: 'outage' });
      }
      
      console.error('Weather fetch error:', e);
      
      setError(buildAppError({
        code: errorCode,
        source: errorSource,
        target,
        status: weatherError?.status,
        reason: weatherError?.reason ?? 'unknown',
      }));
    } finally {
      if (fetchId === activeFetchIdRef.current) {
        activeFetchControllerRef.current = null;
        setIsLoading(false);
      }
    }
  }, [t, setApiStatus, buildAppError]);

  useEffect(() => {
    if (location.name || hasCoordinates(location)) {
      fetchAndSetWeather(location, units);
    }
  }, [location, units, fetchAndSetWeather]);

  useEffect(() => () => activeFetchControllerRef.current?.abort(), []);

  const setLocationByName = useCallback((name: string) => {
    if (name && name.trim()) {
      setLocation({ name: name.trim(), lat: null, lon: null });
      setIsInitializing(false);
      setError(null);
    }
  }, []);

  const setLocationByCoords = useCallback((lat: number, lon: number, onlyIfUnset = false) => {
    if (hasValidCoordinates(lat, lon)) {
      setLocation(previous => onlyIfUnset && (previous.name || hasCoordinates(previous)) ? previous : { lat, lon, name: null });
      setIsInitializing(false);
      setError(null);
    }
  }, []);

  const setLocationBySuggestion = useCallback(({ name, lat, lon }: { name: string; lat: number; lon: number }) => {
    if (name.trim() && hasValidCoordinates(lat, lon)) {
      setLocation({ name: name.trim(), lat, lon });
      setIsInitializing(false);
      setError(null);
    }
  }, []);

  const refreshData = useCallback(() => {
    if (activeFetchControllerRef.current) return;
    if (location.name || hasCoordinates(location)) {
      toast.info(t('Toasts.refreshingData') || 'Refreshing data...');
      fetchAndSetWeather(location, units);
    }
  }, [location, units, fetchAndSetWeather, t]);

  const refreshDataSilently = useCallback(() => {
    if (activeFetchControllerRef.current) return;
    if (location.name || hasCoordinates(location)) {
      fetchAndSetWeather(location, units);
    }
  }, [location, units, fetchAndSetWeather]);

  useEffect(() => {
    if (!location.name && !hasCoordinates(location)) return;
    return startRefreshScheduler({
      refresh: refreshDataSilently,
      isBusy: () => Boolean(activeFetchControllerRef.current),
      lastAttempt: () => lastAttemptRef.current,
      isHidden: () => document.hidden,
      schedule: (callback, delay) => window.setTimeout(callback, delay),
      cancel: (id) => window.clearTimeout(id),
      listen: (callback) => {
        document.addEventListener('visibilitychange', callback);
        window.addEventListener('online', callback);
        return () => {
          document.removeEventListener('visibilitychange', callback);
          window.removeEventListener('online', callback);
        };
      },
    });
  }, [location, refreshDataSilently]);

  const contextValue = useMemo<AppContextType>(() => ({
    location,
    units,
    weatherUnits,
    iconStyle,
    weatherData,
    lastUpdatedAt,
    isLoading,
    error,
    isInitializing,
    apiStatus,
    setUnits,
    setIconStyle,
    setLocationByName,
    setLocationBySuggestion,
    setLocationByCoords,
    refreshData,
    refreshDataSilently,
    finishInitialization,
    setApiStatus,
    reportError,
  }), [
    location,
    units,
    weatherUnits,
    iconStyle,
    weatherData,
    lastUpdatedAt,
    isLoading,
    error,
    isInitializing,
    apiStatus,
    setIconStyle,
    setLocationByName,
    setLocationBySuggestion,
    setLocationByCoords,
    refreshData,
    refreshDataSilently,
    finishInitialization,
    setApiStatus,
    reportError,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
