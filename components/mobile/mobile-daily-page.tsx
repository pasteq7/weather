import { Droplets } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { WeatherData } from '@/lib/types';
import { mapWmoToWeather } from '@/lib/utils';
import MobilePageHeader from './mobile-page-header';
import MobileWeatherIcon from './mobile-weather-icon';
import type { MobileLabels } from './mobile-types';

export default function MobileDailyPage({
  data,
  labels,
  onBack,
}: {
  data: WeatherData;
  labels: MobileLabels;
  onBack: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const days = data.daily.time.slice(0, 7);

  return (
    <div className="mobile-page mobile-page--detail mobile-page--daily">
      <MobilePageHeader title={labels.daily} backLabel={labels.back} onBack={onBack} />
      <section className="mobile-daily-list">
        {days.map((time, index) => {
          const { descriptionKey } = mapWmoToWeather(data.daily.weather_code[index], 1);
          const rainIndex = data.hourly.time.findIndex((hour) => hour >= time);
          const rain = rainIndex >= 0
            ? Math.max(...data.hourly.precipitation_probability.slice(rainIndex, rainIndex + 24))
            : 0;

          return (
            <article key={time}>
              <div className="mobile-daily-list__date">
                <strong>{formatDay(time, locale)}</strong>
                <span>{formatDate(time, locale)}</span>
              </div>
              <MobileWeatherIcon code={data.daily.weather_code[index]} className="mobile-daily-list__icon" />
              <div className="mobile-daily-list__condition">
                <strong>{Math.round(data.daily.temperature_2m_max[index])}° <span>/ {Math.round(data.daily.temperature_2m_min[index])}°</span></strong>
                <small>{t(`WMO.${descriptionKey}`)}</small>
              </div>
              <span className="mobile-daily-list__rain"><Droplets />{rain}%</span>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function formatDay(timestamp: number, locale: string) {
  const label = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(new Date(timestamp * 1000));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDate(timestamp: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(timestamp * 1000));
}
