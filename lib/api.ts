// lib/api.ts

import { WeatherData } from './types';

const GEO_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_GEO_API_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

export class WeatherApiError extends Error {
  code: string;
  status?: number;
  service?: 'weather' | 'geocoding' | 'reverseGeo';

  constructor(
    code: string,
    options: {
      status?: number;
      service?: 'weather' | 'geocoding' | 'reverseGeo';
    } = {}
  ) {
    super(code);
    this.name = 'WeatherApiError';
    this.code = code;
    this.status = options.status;
    this.service = options.service;
  }
}

type GeocodingResponse = {
  results?: Array<{
    latitude?: number;
    longitude?: number;
    name?: string;
  }>;
};

const fetchJson = async <T>(
  url: string,
  errorCode: string,
  service?: WeatherApiError['service']
): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new WeatherApiError(errorCode, { service });
  }

  if (!response.ok) {
    throw new WeatherApiError(errorCode, { status: response.status, service });
  }

  try {
    return await response.json() as T;
  } catch {
    throw new WeatherApiError('ERROR_INVALID_RESPONSE', { service });
  }
};

const hasNumberArray = (value: unknown) => (
  Array.isArray(value) && value.every((item) => typeof item === 'number')
);

const isWeatherData = (data: unknown): data is WeatherData => {
  if (!data || typeof data !== 'object') return false;

  const candidate = data as Partial<WeatherData>;
  const { current, hourly, daily } = candidate;

  return Boolean(
    typeof candidate.timezone === 'string' &&
    current &&
    typeof current.temperature_2m === 'number' &&
    typeof current.relative_humidity_2m === 'number' &&
    typeof current.weather_code === 'number' &&
    typeof current.wind_speed_10m === 'number' &&
    typeof current.pressure_msl === 'number' &&
    hourly &&
    hasNumberArray(hourly.time) &&
    hasNumberArray(hourly.temperature_2m) &&
    hasNumberArray(hourly.precipitation_probability) &&
    hasNumberArray(hourly.weather_code) &&
    hasNumberArray(hourly.wind_speed_10m) &&
    hasNumberArray(hourly.visibility) &&
    daily &&
    hasNumberArray(daily.time) &&
    hasNumberArray(daily.weather_code) &&
    hasNumberArray(daily.temperature_2m_max) &&
    hasNumberArray(daily.temperature_2m_min) &&
    hasNumberArray(daily.sunrise) &&
    hasNumberArray(daily.sunset)
  );
};

export const getCoordinatesForCity = async (city: string) => {
  const cityName = city.split(',')[0].trim();

  const params = new URLSearchParams({
    name: cityName,
    count: '1',
    language: 'en',
    format: 'json'
  });

  const data = await fetchJson<GeocodingResponse>(`${GEO_API_URL}?${params.toString()}`, 'ERROR_FETCH_COORDINATES', 'geocoding');
  const result = data.results?.[0];

  if (!result || typeof result.latitude !== 'number' || typeof result.longitude !== 'number') {
    throw new WeatherApiError('ERROR_CITY_NOT_FOUND', { service: 'geocoding' });
  }
  const { latitude, longitude } = result;
  const name = result.name || cityName;

  return { latitude, longitude, name };
};

export const getCityNameFromCoordinates = async (latitude: number, longitude: number): Promise<{name: string | null, ok: boolean}> => {
    const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        localityLanguage: 'en',
    });
    try {
        const response = await fetch(`${REVERSE_GEO_API_URL}?${params.toString()}`);
        if (!response.ok) return { name: null, ok: false };
        
        const data = await response.json();
        if (data && data.city) {
          const name = data.countryCode ? `${data.city}, ${data.countryCode}` : data.city;
          return { name, ok: true };
        }
        return { name: null, ok: true };
    } catch (error) {
        console.error("Failed to fetch city name from coordinates", error);
        return { name: null, ok: false };
    }
};

export const fetchWeatherData = async (latitude: number, longitude: number, units: string, timezone: string = 'auto'): Promise<WeatherData> => {
  const isImperial = units === 'imperial';

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m,pressure_msl',
    hourly: 'temperature_2m,precipitation_probability,weather_code,visibility,is_day,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
    timeformat: 'unixtime',
    timezone: timezone,
    forecast_days: '14',
    temperature_unit: isImperial ? 'fahrenheit' : 'celsius',
    wind_speed_unit: isImperial ? 'mph' : 'kmh',
  });

  const data = await fetchJson<unknown>(`${WEATHER_API_URL}?${params.toString()}`, 'ERROR_FETCH_WEATHER', 'weather');

  if (!isWeatherData(data)) {
    throw new WeatherApiError('ERROR_INVALID_WEATHER_DATA', { service: 'weather' });
  }

  return data;
};

export const fetchWeatherByCity = async (city: string, units: string = 'metric', timezone: string = 'auto') => {
  const { latitude, longitude, name } = await getCoordinatesForCity(city);
  const weatherData = await fetchWeatherData(latitude, longitude, units, timezone);
  
  return { ...weatherData, name, latitude, longitude };
};
