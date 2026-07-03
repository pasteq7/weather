// app/context/AppContext.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { WeatherData, ApiIssueKey } from '@/lib/types';
import { fetchWeatherByCity, fetchWeatherData, getCityNameFromCoordinates, WeatherApiError } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { MeteoconStyle } from '@/lib/meteocons';

export type ApiStatusValue = 'operational' | 'partial' | 'outage' | 'pending';

export interface ApiStatus {
  status: ApiStatusValue;
  issues?: ApiIssueKey[];
}

interface ApiStatuses {
  openMeteo: ApiStatus;
  reverseGeo: ApiStatus;
  geolocation: ApiStatus;
}

interface Location {
  lat: number | null;
  lon: number | null;
  name: string | null;
}

export type AppErrorSource = 'weather' | 'geocoding' | 'reverseGeo' | 'geolocation' | 'unknown';

export interface AppError {
  source: AppErrorSource;
  title: string;
  message: string;
  detail: string;
  code: string;
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
  message?: string;
  title?: string;
  detail?: string;
  canRetry?: boolean;
} | null;

interface AppContextType {
  location: Location;
  units: 'metric' | 'imperial';
  iconStyle: MeteoconStyle;
  weatherData: WeatherData | null;
  isLoading: boolean;
  error: AppError | null;
  isInitializing: boolean;
  apiStatus: ApiStatuses;
  setUnits: (units: 'metric' | 'imperial') => void;
  setIconStyle: (style: MeteoconStyle) => void;
  setLocationByName: (name: string) => void;
  setLocationByCoords: (lat: number, lon: number) => void;
  refreshData: () => void;
  finishInitialization: () => void;
  setApiStatus: (service: keyof ApiStatuses, status: ApiStatus) => void;
  reportError: (error: AppErrorInput) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const hasCoordinates = (location: Location) => location.lat !== null && location.lon !== null;
const ICON_STYLE_STORAGE_KEY = 'weather-icon-style';
const NON_RETRYABLE_ERROR_CODES = new Set(['ERROR_CITY_NOT_FOUND', 'ERROR_GEOLOCATION_DENIED']);

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

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const t = useTranslations();
  const [location, setLocation] = useState<Location>({ lat: null, lon: null, name: null });
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [iconStyle, setIconStyleState] = useState<MeteoconStyle>(getInitialIconStyle);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [apiStatus, setApiStatusState] = useState<ApiStatuses>({
    openMeteo: { status: 'operational' },
    reverseGeo: { status: 'operational' },
    geolocation: { status: 'pending' },
  });
  
  const hasInitializedRef = useRef(false);
  const isFirstRender = useRef(true);
  const activeFetchIdRef = useRef(0);

  const setApiStatus = useCallback((service: keyof ApiStatuses, status: ApiStatus) => {
    setApiStatusState(prev => ({ ...prev, [service]: status }));
  }, []);

  const buildAppError = useCallback((input: Exclude<AppErrorInput, null>): AppError => {
    if ('occurredAt' in input) {
      return input;
    }

    const code = input.code.startsWith('ERROR_') ? input.code : 'ERROR_UNKNOWN';
    const source = input.source ?? ERROR_SOURCE_BY_CODE[code] ?? 'unknown';
    const sourceLabel = t(`Errors.source.${source}`);
    const translatedMessage = t(`Errors.${code}`);
    const message = input.message ?? (
      translatedMessage === `Errors.${code}` ? t('Errors.ERROR_UNKNOWN') : translatedMessage
    );
    const title = input.title ?? t('Errors.failedSourceTitle', { service: sourceLabel });
    const detail = input.detail ?? t(input.target ? 'Errors.detailWithTarget' : 'Errors.detail', {
      service: sourceLabel,
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

  const finishInitialization = useCallback(() => {
    setIsInitializing(false);
    hasInitializedRef.current = true;
  }, []);

  const shouldAutoGeolocate = isInitializing && !hasInitializedRef.current && isFirstRender.current && !location.name && !hasCoordinates(location);

  useEffect(() => {
    isFirstRender.current = false;
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
    setIsLoading(true);
    setError(null);

    try {
      const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto';
      let data: WeatherData;
      let name = currentLocation.name;
      let lat = currentLocation.lat;
      let lon = currentLocation.lon;
      let nonBlockingError: AppError | null = null;

      if (lat !== null && lon !== null) {
        data = await fetchWeatherData(lat, lon, currentUnits, clientTimezone);
        
        if (!name) {
          const geoResult = await getCityNameFromCoordinates(lat, lon);
          setApiStatus('reverseGeo', { status: geoResult.ok ? 'operational' : 'outage' });
          if (!geoResult.ok) {
            nonBlockingError = buildAppError({
              code: 'ERROR_REVERSE_GEOCODING',
              source: 'reverseGeo',
              target: t('Weather.currentLocation'),
              canRetry: true,
            });
          }
          name = geoResult.name || t('Weather.currentLocation');
        }
      } else if (name) {
        const result = await fetchWeatherByCity(name, currentUnits, clientTimezone);
        setApiStatus('reverseGeo', { status: 'operational' });
        data = result;
        name = result.name || name;
        lat = result.latitude;
        lon = result.longitude;
      } else {
        throw new WeatherApiError('ERROR_NO_LOCATION');
      }
      
      const completeWeatherData = { ...data, name, latitude: lat ?? undefined, longitude: lon ?? undefined };
      if (fetchId !== activeFetchIdRef.current) return;

      setWeatherData(completeWeatherData);
      setError(nonBlockingError);

      setApiStatus('openMeteo', { status: 'operational' });

    } catch (e) {
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
      }));
      setWeatherData(previousData => previousData);
    } finally {
      if (fetchId === activeFetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [t, setApiStatus, buildAppError]);

  useEffect(() => {
    if (location.name || hasCoordinates(location)) {
      fetchAndSetWeather(location, units);
    }
  }, [location, units, fetchAndSetWeather]);

  useEffect(() => {
    if (isInitializing && hasInitializedRef.current && (location.name || hasCoordinates(location))) {
      finishInitialization();
    }
  }, [isInitializing, location, finishInitialization]);
  
  const setLocationByName = useCallback((name: string) => {
    if (name && name.trim()) {
      setLocation({ name: name.trim(), lat: null, lon: null });
      setError(null);
    }
  }, []);

  const setLocationByCoords = useCallback((lat: number, lon: number) => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      setLocation({ lat, lon, name: null });
      setError(null);
    }
  }, []);

  const refreshData = useCallback(() => {
    if (location.name || hasCoordinates(location)) {
      toast.info(t('Toasts.refreshingData') || 'Refreshing data...');
      fetchAndSetWeather(location, units);
    }
  }, [location, units, fetchAndSetWeather, t]);

  return (
    <AppContext.Provider value={{ 
      location, 
      units, 
      iconStyle,
      weatherData, 
      isLoading, 
      error, 
      isInitializing: shouldAutoGeolocate,
      apiStatus,
      setUnits, 
      setIconStyle,
      setLocationByName, 
      setLocationByCoords, 
      refreshData,
      finishInitialization,
      setApiStatus,
      reportError
    }}>
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
