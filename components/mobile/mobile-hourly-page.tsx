import { useState } from 'react';
import { Droplets, Wind } from 'lucide-react';
import { useLocale } from 'next-intl';
import type { WeatherData } from '@/lib/types';
import MobilePageHeader from './mobile-page-header';
import MobileLineChart from './mobile-line-chart';
import MobileWeatherIcon from './mobile-weather-icon';
import type { MobileLabels } from './mobile-types';

export default function MobileHourlyPage({
  data,
  labels,
  onBack,
}: {
  data: WeatherData;
  labels: MobileLabels;
  onBack: () => void;
}) {
  const locale = useLocale();
  const [visibleSeries, setVisibleSeries] = useState({ rain: false, wind: false });
  const start = Math.max(0, data.hourly.time.findIndex((time) => time >= data.current.time));
  const hours = data.hourly.time.slice(start, start + 24).map((time, index) => ({
    time,
    temp: data.hourly.temperature_2m[start + index],
    rain: data.hourly.precipitation_probability[start + index],
    wind: data.hourly.wind_speed_10m[start + index],
    code: data.hourly.weather_code[start + index],
    isDay: data.hourly.is_day[start + index],
  }));
  const temperatures = hours.map((hour) => hour.temp);
  const minTemperature = Math.min(...temperatures);
  const maxTemperature = Math.max(...temperatures);
  const chartSeries = [
    { key: 'temperature', values: temperatures, color: 'var(--mobile-accent)', fill: true },
    ...(visibleSeries.rain
      ? [{ key: 'rain', values: hours.map((hour) => hour.rain), color: 'var(--mobile-blue)' }]
      : []),
    ...(visibleSeries.wind
      ? [{ key: 'wind', values: hours.map((hour) => hour.wind), color: 'var(--chart-4)' }]
      : []),
  ];

  return (
    <div className="mobile-page mobile-page--detail">
      <MobilePageHeader title={labels.hourly} backLabel={labels.back} onBack={onBack} />

      <section className="mobile-hourly-chart">
        <div className="mobile-chart-legend">
          <span data-active="true"><i />{labels.temperature}</span>
          <button
            type="button"
            data-active={visibleSeries.rain}
            onClick={() => setVisibleSeries((current) => ({ ...current, rain: !current.rain }))}
            aria-pressed={visibleSeries.rain}
          >
            <i />{labels.rain}
          </button>
          <button
            type="button"
            data-active={visibleSeries.wind}
            onClick={() => setVisibleSeries((current) => ({ ...current, wind: !current.wind }))}
            aria-pressed={visibleSeries.wind}
          >
            <i /><Wind />{locale.startsWith('fr') ? 'Vent' : 'Wind'}
          </button>
        </div>
        <div className="mobile-chart-area">
          <span className="mobile-chart-axis mobile-chart-axis--top">{Math.ceil(maxTemperature)}°</span>
          <span className="mobile-chart-axis mobile-chart-axis--middle">{Math.round((maxTemperature + minTemperature) / 2)}°</span>
          <span className="mobile-chart-axis mobile-chart-axis--bottom">{Math.floor(minTemperature)}°</span>
          <MobileLineChart ariaLabel="Hourly weather trend" series={chartSeries} />
        </div>
      </section>

      <section className="mobile-panel mobile-hour-strip">
        {hours.filter((_, index) => index % 3 === 0).slice(0, 6).map((hour) => (
          <article key={hour.time}>
            <time>{formatHour(hour.time, data.timezone, locale)}</time>
            <MobileWeatherIcon code={hour.code} isDay={hour.isDay} className="mobile-hour-strip__icon" />
            <strong>{Math.round(hour.temp)}°</strong>
            <span><Droplets />{Math.round(hour.rain)}%</span>
          </article>
        ))}
      </section>

    </div>
  );
}

function formatHour(timestamp: number, timezone: string, locale: string) {
  return new Date(timestamp * 1000).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });
}
