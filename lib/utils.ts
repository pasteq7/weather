import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { WMO_CODES, TEMPERATURE_UNIT_CELSIUS, TEMPERATURE_UNIT_FAHRENHEIT, WIND_UNIT_KMH, WIND_UNIT_MPH } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const mapWmoToWeather = (wmoCode: number, isDay: number) => {
  const weather = WMO_CODES[wmoCode];
  const dayNightSuffix = isDay === 1 ? 'd' : 'n';
  
  if (!weather) {
    return {
      descriptionKey: 'unknown',
      icon: `01${dayNightSuffix}`,
    };
  }

  return {
    descriptionKey: `${wmoCode}`,
    icon: `${weather.icon}${dayNightSuffix}`,
  };
};

export const formatTemperature = (temp: number, units: string): [string, string] => {
    if (temp === null || temp === undefined) return ['--', ''];
    const unit = units === 'imperial' ? TEMPERATURE_UNIT_FAHRENHEIT : TEMPERATURE_UNIT_CELSIUS;
    return [Math.round(temp).toString(), unit];
};

export const formatWindSpeed = (speed: number, units: string): [string, string] => {
  if (speed === null || speed === undefined) return ['--', ''];
  const unit = units === 'imperial' ? WIND_UNIT_MPH : WIND_UNIT_KMH;
  return [Math.round(speed).toString(), unit];
};

export const formatHumidity = (humidity: number): [string, string] => {
  if (humidity === null || humidity === undefined) return ['--', '%'];
  return [Math.round(humidity).toString(), '%'];
};

export const formatPressure = (pressure: number, units: string): [string, string] => {
  if (pressure === null || pressure === undefined) return ['--', ''];
  if (units === 'imperial') {
    const pressureInInHg = pressure * 0.02953;
    return [pressureInInHg.toFixed(2), 'inHg'];
  }
  return [Math.round(pressure).toString(), 'hPa'];
};

export const formatVisibility = (visibility: number, units: string): [string, string] => {
  if (visibility === null || visibility === undefined) return ['--', ''];
  const distanceInKm = visibility / 1000;
  if (units === 'imperial') {
    const distanceInMiles = distanceInKm * 0.621371;
    return [distanceInMiles.toFixed(1), 'mi'];
  }
  return [distanceInKm.toFixed(1), 'km'];
};

export const formatTime = (time: Date, timezone: string, units: string) => {
  if (!time || isNaN(time.getTime())) return '--';
  return time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: units === 'imperial',
    timeZone: timezone
  });
};

/**
 * NOTE: This function is not recommended for getting chart midnight lines.
 * The `weatherData.daily.time` array from the API should be used directly.
 */
export const getMidnights = (timestamps: number[]) => {
  const midnights: number[] = [];
  let lastDay = -1;
  timestamps.forEach(ts => {
    const date = new Date(ts * 1000);
    if (date.getHours() === 0 && date.getDate() !== lastDay) {
      midnights.push(ts);
      lastDay = date.getDate();
    }
  });
  return midnights;
};