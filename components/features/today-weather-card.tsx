'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CurrentWeatherIcon from "@/components/icons/current-weather-icon";
import { formatTemperature, mapWmoToWeather } from "@/lib/utils";
import { WeatherData } from "@/lib/types";
import { useTranslations } from 'next-intl';

interface TodayWeatherCardProps {
  weatherData: WeatherData;
  units: string;
  location?: string;
}

export default function TodayWeatherCard({ weatherData, units, location }: TodayWeatherCardProps) {
  const t = useTranslations();
  const [lastFetchedTime, setLastFetchedTime] = useState('');

  useEffect(() => {
    // This effect now runs whenever new weatherData is received.
    if (weatherData) {
      // Get the current time from the user's computer
      const now = new Date();
      const time = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: units === 'imperial',
      });
      setLastFetchedTime(time);
    }
  }, [weatherData, units]); // Re-run when data or units change

  if (!weatherData) {
    return (
      <Card className="flex flex-grow flex-col items-center justify-center p-4">
        <Skeleton className="w-32 h-32 rounded-full" />
        <Skeleton className="w-3/4 h-10 mt-4" />
        <Skeleton className="w-1/2 h-6 mt-2" />
        <Skeleton className="w-1/3 h-4 mt-2" />
      </Card>
    );
  }

  const { current } = weatherData;
  const { descriptionKey, icon } = mapWmoToWeather(current.weather_code, current.is_day);
  const description = t(`WMO.${descriptionKey}`);
  const [temp, tempUnit] = formatTemperature(current.temperature_2m, units);
  const [feelsLikeTemp] = formatTemperature(current.apparent_temperature ?? current.temperature_2m, units);
  const [highTemp] = formatTemperature(weatherData.daily.temperature_2m_max[0], units);
  const [lowTemp] = formatTemperature(weatherData.daily.temperature_2m_min[0], units);

  const displayLocation = (location || weatherData.name || t('Weather.unknownLocation'))
    .split(',', 1)[0]
    .trim();
  const displayLastFetchedTime = lastFetchedTime || '--:--';
  const lastUpdatedLabel = t('Weather.lastUpdated', { time: '' }).replace(/\s*[:：]\s*$/, '');

  return (
    <Card className="today-weather-card weather-surface relative h-full shrink-0 overflow-hidden p-0">
      <div className="today-weather-card__body relative flex h-full min-h-[18.5rem] flex-col gap-3 p-3.5 min-[420px]:min-h-[16rem] sm:min-h-[16.25rem] sm:p-4 min-[72rem]:min-h-[15.5rem]">
        <div className="today-weather-card__header grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h2
              className="today-weather-card__title max-w-full text-[1.55rem] font-medium leading-[1.08] text-card-foreground sm:text-[1.7rem] min-[72rem]:text-[1.6rem]"
              title={displayLocation}
            >
              {displayLocation}
            </h2>
            <p className="today-weather-card__description mt-1 text-xs font-medium capitalize text-muted-foreground sm:text-sm">{description}</p>
          </div>
          <div className="today-weather-card__updated shrink-0 text-right text-[0.66rem] font-medium leading-snug text-muted-foreground/90">
            <span className="today-weather-card__updated-label block">{lastUpdatedLabel}</span>
            <span className="today-weather-card__updated-time block font-medium text-card-foreground/85">{displayLastFetchedTime}</span>
          </div>
        </div>

        <div className="today-weather-card__current mt-3 grid min-h-0 flex-1 grid-cols-[auto_auto] content-center justify-center items-center gap-3 px-2 py-1.5 max-[20rem]:grid-cols-1 max-[20rem]:justify-items-center max-[20rem]:gap-2">
          <div className="flex min-h-0 justify-center">
            <div className="today-weather-card__icon h-36 w-36 shrink-0 drop-shadow-[0_18px_24px_rgba(0,0,0,0.22)] sm:h-42 sm:w-42 min-[72rem]:h-42 min-[72rem]:w-42">
              <CurrentWeatherIcon iconCode={icon} />
            </div>
          </div>
          <div className="flex min-w-0 flex-col items-start text-left max-[20rem]:items-center max-[20rem]:text-center">
            <p className="today-weather-card__temperature tabular-nums text-[4.25rem] font-normal leading-none text-card-foreground sm:text-[4.75rem] min-[72rem]:text-[4.5rem]">
              {temp}
              <span className="today-weather-card__unit align-top text-xl font-medium text-muted-foreground/75 sm:text-2xl">{tempUnit}</span>
            </p>
            <div className="today-weather-card__details mt-1.5 flex w-full flex-col items-start gap-1.5 max-[20rem]:items-center">
              <p className="today-weather-card__feels-like text-xs font-medium text-muted-foreground sm:text-sm">
                {t('Weather.feelsLike')} {feelsLikeTemp}{tempUnit}
              </p>
              <p className="today-weather-card__range self-start text-left text-sm font-medium max-[20rem]:self-auto">
                <span className="today-weather-card__temp-high">{highTemp}{tempUnit}</span>
                <span className="text-muted-foreground/70"> / </span>
                <span className="today-weather-card__temp-low">{lowTemp}{tempUnit}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
