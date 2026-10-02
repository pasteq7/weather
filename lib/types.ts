// lib/types.ts

export type ApiIssueKey = 'wind_speed_10m' | 'pressure_msl';

export interface WeatherData {
  name?: string;
  latitude?: number;
  longitude?: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current: {
    time: number;
    temperature_2m: number;
    apparent_temperature?: number | null;
    relative_humidity_2m: number | null;
    is_day: number;
    weather_code: number;
    wind_speed_10m: number | null;
    pressure_msl: number | null;
  };
  hourly: {
    time: number[];
    temperature_2m: number[];
    precipitation_probability: (number | null)[];
    weather_code: number[];
    wind_speed_10m: (number | null)[];
    visibility: (number | null)[];
    is_day: number[];
  };
  daily: {
    time: number[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: (number | null)[];
    sunset: (number | null)[];
  };
}

export interface DailyDataPoint {
  time: number;
  weather_code: number;
  temperature_2m_max: number;
  temperature_2m_min: number;
}

export interface HourlyDataPoint {
  time: number;
  temperature_2m: number;
  precipitation_probability: number | null;
  weather_code: number;
  wind_speed_10m: number | null;
  visibility: number | null;
  is_day: number;
}

export interface Messages {
  Metadata: {
    title: string;
    description: string;
  };
  [key: string]: unknown;
}
