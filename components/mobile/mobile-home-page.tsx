import { useState } from 'react';
import { Droplets, Ellipsis, Gauge, Sunrise, Sunset, Wind } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { WeatherData } from '@/lib/types';
import { formatPressure, formatVisibility, formatWindSpeed, mapWmoToWeather } from '@/lib/utils';
import CurrentWeatherIcon from '@/components/icons/current-weather-icon';
import MobileSearch from './mobile-search';
import MobileWeatherIcon from './mobile-weather-icon';
import type { MobileLabels } from './mobile-types';

export default function MobileHomePage({
  data,
  labels,
  units,
  onGeolocate,
  onSearch,
  onSuggestion,
}: {
  data: WeatherData;
  labels: MobileLabels;
  units: 'metric' | 'imperial';
  onGeolocate: () => void;
  onSearch: (location: string) => void;
  onSuggestion: (suggestion: { name: string; lat: number; lon: number }) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const location = (data.name || t('Weather.unknownLocation')).split(',')[0];
  const { icon, descriptionKey } = mapWmoToWeather(data.current.weather_code, data.current.is_day);
  const temperature = Math.round(data.current.temperature_2m);
  const feelsLike = Math.round(data.current.apparent_temperature ?? data.current.temperature_2m);
  const high = Math.round(data.daily.temperature_2m_max[0]);
  const low = Math.round(data.daily.temperature_2m_min[0]);
  const [wind, windUnit] = formatWindSpeed(data.current.wind_speed_10m, units);
  const [pressure, pressureUnit] = formatPressure(data.current.pressure_msl, units);
  const nowIndex = data.hourly.time.findIndex((time) => time >= data.current.time);
  const visibilityRaw = data.hourly.visibility[Math.max(0, nowIndex)];
  const [visibility, visibilityUnit] = formatVisibility(visibilityRaw, units);
  const temperatureUnit = units === 'imperial' ? '°F' : '°C';

  const metrics = [
    { icon: Droplets, value: `${Math.round(data.current.relative_humidity_2m)}%`, label: t('Weather.humidity') },
    { icon: Wind, value: `${wind} ${windUnit}`, label: t('Weather.windSpeed') },
    { icon: Gauge, value: `${pressure} ${pressureUnit}`, label: t('Weather.pressure') },
    { icon: Ellipsis, value: `${visibility} ${visibilityUnit}`, label: t('Weather.visibility') },
    { icon: Sunrise, value: formatClock(data.daily.sunrise[0], data.timezone), label: t('Weather.sunrise') },
    { icon: Sunset, value: formatClock(data.daily.sunset[0], data.timezone), label: t('Weather.sunset') },
  ];

  return (
    <div className="mobile-page mobile-page--home">
      <MobileSearch
        currentLocation={data.name || ''}
        labels={labels}
        onLocate={onGeolocate}
        onSearch={onSearch}
        onSuggestion={onSuggestion}
      />

      <section className="mobile-current">
        <div className="mobile-current__heading">
          <div>
            <h1>{location}</h1>
            <p>{t(`WMO.${descriptionKey}`)}</p>
          </div>
        </div>

        <div className="mobile-current__hero">
          <CurrentWeatherIcon iconCode={icon} className="mobile-current__icon" />
          <div>
            <p className="mobile-current__temperature">{temperature}<span>{temperatureUnit}</span></p>
            <p>{t('Weather.feelsLike')} {feelsLike}°</p>
            <p className="mobile-current__range"><strong>{high}°</strong> / <span>{low}°</span></p>
          </div>
        </div>
      </section>

      <section className="mobile-metric-grid" aria-label="Current conditions">
        {metrics.map(({ icon: Icon, value, label }) => (
          <button
            className="mobile-metric-card"
            data-tooltip-open={activeMetric === label}
            key={label}
            type="button"
            onClick={() => setActiveMetric((active) => active === label ? null : label)}
            aria-label={label}
            aria-expanded={activeMetric === label}
          >
            <Icon aria-hidden="true" />
            <div className="mobile-metric-card__content"><strong>{value}</strong></div>
            {activeMetric === label && <span className="mobile-metric-card__tooltip" role="tooltip">{label}</span>}
          </button>
        ))}
      </section>

      <section className="mobile-panel mobile-daily-preview">
        <header>
          <h2>{labels.daily}</h2>
        </header>
        <div className="mobile-daily-preview__grid">
          {data.daily.time.slice(0, 4).map((time, index) => (
            <button type="button" key={time}>
              <span>{shortDay(time, locale)}</span>
              <MobileWeatherIcon code={data.daily.weather_code[index]} className="mobile-daily-preview__icon" />
              <strong>{Math.round(data.daily.temperature_2m_max[index])}°<small> / {Math.round(data.daily.temperature_2m_min[index])}°</small></strong>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatClock(timestamp: number, timezone: string) {
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });
}

function shortDay(timestamp: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' })
    .format(new Date(timestamp * 1000))
    .replace('.', '');
}
