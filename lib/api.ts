// lib/api.ts

import type { WeatherData } from './types';

const GEO_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_GEO_API_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

export class WeatherApiError extends Error {
  code: string;
  status?: number;
  service?: 'weather' | 'geocoding' | 'reverseGeo';
  reason?: 'network' | 'http' | 'parse' | 'schema' | 'notFound' | 'missingLocation';

  constructor(
    code: string,
    options: {
      status?: number;
      service?: 'weather' | 'geocoding' | 'reverseGeo';
      reason?: WeatherApiError['reason'];
    } = {}
  ) {
    super(code);
    this.name = 'WeatherApiError';
    this.code = code;
    this.status = options.status;
    this.service = options.service;
    this.reason = options.reason;
  }
}

type GeocodingResponse = {
  results?: Array<{
    latitude?: number;
    longitude?: number;
    name?: string;
    admin1?: string;
    country?: string;
    country_code?: string;
  }>;
};

export interface LocationSuggestion {
  latitude: number;
  longitude: number;
  name: string;
  label: string;
}

const fetchJson = async <T>(
  url: string,
  errorCode: string,
  service?: WeatherApiError['service'],
  signal?: AbortSignal
): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new WeatherApiError(errorCode, { service, reason: 'network' });
  }

  if (!response.ok) {
    throw new WeatherApiError(errorCode, { status: response.status, service, reason: 'http' });
  }

  try {
    return await response.json() as T;
  } catch {
    throw new WeatherApiError('ERROR_INVALID_RESPONSE', { service, reason: 'parse' });
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isArrayOfLength = (value: unknown, length: number): value is unknown[] =>
  Array.isArray(value) && value.length === length;

// Open-Meteo can return null for a variable or a forecast hour while other
// variables remain usable. Keep gaps as null instead of rejecting the response.
export const parseWeatherData = (data: unknown): WeatherData | null => {
  if (!isRecord(data) || !isRecord(data.current) || !isRecord(data.hourly) || !isRecord(data.daily)) return null;
  const { current, hourly, daily } = data;
  const currentTime = current.time;
  const hourlyTime = hourly.time;
  const hourlyTemperature = hourly.temperature_2m;
  const hourlyWeatherCode = hourly.weather_code;
  const hourlyIsDay = hourly.is_day;
  const dailyTime = daily.time;
  const dailyWeatherCode = daily.weather_code;
  const dailyMax = daily.temperature_2m_max;
  const dailyMin = daily.temperature_2m_min;
  const dailySunrise = daily.sunrise;
  const dailySunset = daily.sunset;
  if (
    typeof data.timezone !== 'string' ||
    !isNumber(currentTime) ||
    !isNumber(current.temperature_2m) ||
    !isNumber(current.weather_code) ||
    !isNumber(current.is_day) ||
    !Array.isArray(hourlyTime) || hourlyTime.length === 0 ||
    !isArrayOfLength(hourlyTemperature, hourlyTime.length) ||
    !isArrayOfLength(hourlyWeatherCode, hourlyTime.length) ||
    !isArrayOfLength(hourlyIsDay, hourlyTime.length) ||
    !Array.isArray(dailyTime) || dailyTime.length === 0 ||
    !isArrayOfLength(dailyWeatherCode, dailyTime.length) ||
    !isArrayOfLength(dailyMax, dailyTime.length) ||
    !isArrayOfLength(dailyMin, dailyTime.length)
  ) return null;

  const hourIndices = hourlyTime.flatMap((time, index) =>
    isNumber(time) && isNumber(hourlyTemperature[index]) && isNumber(hourlyWeatherCode[index]) && isNumber(hourlyIsDay[index])
      ? [index] : []);
  const dayIndices = dailyTime.flatMap((time, index) =>
    isNumber(time) && isNumber(dailyWeatherCode[index]) && isNumber(dailyMax[index]) &&
    isNumber(dailyMin[index])
      ? [index] : []);
  if (!hourIndices.some((index) => hourlyTime[index] >= currentTime) || dayIndices[0] !== 0) return null;

  const optionalHourly = ['precipitation_probability', 'wind_speed_10m', 'visibility'] as const;
  const hourlyValues = Object.fromEntries(optionalHourly.map((key) => {
    const values = hourly[key];
    return [key, hourIndices.map((index) =>
      Array.isArray(values) && isNumber(values[index]) ? values[index] : null)];
  })) as Pick<WeatherData['hourly'], typeof optionalHourly[number]>;

  return {
    ...data,
    current: {
      ...current,
      apparent_temperature: isNumber(current.apparent_temperature) ? current.apparent_temperature : null,
      relative_humidity_2m: isNumber(current.relative_humidity_2m) ? current.relative_humidity_2m : null,
      wind_speed_10m: isNumber(current.wind_speed_10m) ? current.wind_speed_10m : null,
      pressure_msl: isNumber(current.pressure_msl) ? current.pressure_msl : null,
    },
    hourly: {
      ...hourly,
      time: hourIndices.map((index) => hourlyTime[index]),
      temperature_2m: hourIndices.map((index) => hourlyTemperature[index]),
      weather_code: hourIndices.map((index) => hourlyWeatherCode[index]),
      is_day: hourIndices.map((index) => hourlyIsDay[index]),
      ...hourlyValues,
    },
    daily: {
      ...daily,
      time: dayIndices.map((index) => dailyTime[index]),
      weather_code: dayIndices.map((index) => dailyWeatherCode[index]),
      temperature_2m_max: dayIndices.map((index) => dailyMax[index]),
      temperature_2m_min: dayIndices.map((index) => dailyMin[index]),
      sunrise: dayIndices.map((index) =>
        Array.isArray(dailySunrise) && isNumber(dailySunrise[index]) ? dailySunrise[index] : null),
      sunset: dayIndices.map((index) =>
        Array.isArray(dailySunset) && isNumber(dailySunset[index]) ? dailySunset[index] : null),
    },
  } as unknown as WeatherData;
};

export const getCoordinatesForCity = async (city: string, signal?: AbortSignal) => {
  const cityName = city.split(',')[0].trim();

  const params = new URLSearchParams({
    name: cityName,
    count: '1',
    language: 'en',
    format: 'json'
  });

  const data = await fetchJson<GeocodingResponse>(`${GEO_API_URL}?${params.toString()}`, 'ERROR_FETCH_COORDINATES', 'geocoding', signal);
  const result = data.results?.[0];

  if (!result || typeof result.latitude !== 'number' || typeof result.longitude !== 'number') {
    throw new WeatherApiError('ERROR_CITY_NOT_FOUND', { service: 'geocoding', reason: 'notFound' });
  }
  const { latitude, longitude } = result;
  const name = result.name || cityName;

  return { latitude, longitude, name };
};

export const searchLocationSuggestions = async (
  query: string,
  language: string = 'en',
  signal?: AbortSignal
): Promise<LocationSuggestion[]> => {
  const params = new URLSearchParams({
    name: query.trim(),
    count: '6',
    language,
    format: 'json',
  });

  let response: Response;
  try {
    response = await fetch(`${GEO_API_URL}?${params.toString()}`, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new WeatherApiError('ERROR_FETCH_COORDINATES', { service: 'geocoding', reason: 'network' });
  }

  if (!response.ok) {
    throw new WeatherApiError('ERROR_FETCH_COORDINATES', { status: response.status, service: 'geocoding', reason: 'http' });
  }

  let data: GeocodingResponse;
  try {
    data = await response.json() as GeocodingResponse;
  } catch {
    throw new WeatherApiError('ERROR_INVALID_RESPONSE', { service: 'geocoding', reason: 'parse' });
  }

  return (data.results ?? []).flatMap((result) => {
    if (typeof result.latitude !== 'number' || typeof result.longitude !== 'number' || !result.name) return [];

    const details = [result.admin1, result.country ?? result.country_code]
      .filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);

    return [{
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.name,
      label: [result.name, ...details].join(', '),
    }];
  });
};

export const getCityNameFromCoordinates = async (latitude: number, longitude: number, signal?: AbortSignal): Promise<{name: string | null, ok: boolean}> => {
    const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        localityLanguage: 'en',
    });
    try {
        const response = await fetch(`${REVERSE_GEO_API_URL}?${params.toString()}`, { signal });
        if (!response.ok) return { name: null, ok: false };
        
        const data = await response.json();
        if (data && data.city) {
          const name = data.countryCode ? `${data.city}, ${data.countryCode}` : data.city;
          return { name, ok: true };
        }
        return { name: null, ok: true };
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error;
        console.error("Failed to fetch city name from coordinates", error);
        return { name: null, ok: false };
    }
};

export const fetchWeatherData = async (latitude: number, longitude: number, units: string = 'metric', timezone: string = 'auto', signal?: AbortSignal): Promise<WeatherData> => {
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

  const data = await fetchJson<unknown>(`${WEATHER_API_URL}?${params.toString()}`, 'ERROR_FETCH_WEATHER', 'weather', signal);

  const weatherData = parseWeatherData(data);
  if (!weatherData) {
    throw new WeatherApiError('ERROR_INVALID_WEATHER_DATA', { service: 'weather', reason: 'schema' });
  }

  return weatherData;
};

export const fetchWeatherByCity = async (city: string, units: string = 'metric', timezone: string = 'auto', signal?: AbortSignal) => {
  const { latitude, longitude, name } = await getCoordinatesForCity(city, signal);
  const weatherData = await fetchWeatherData(latitude, longitude, units, timezone, signal);
  
  return { ...weatherData, name, latitude, longitude };
};
