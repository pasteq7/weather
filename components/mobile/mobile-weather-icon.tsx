import CurrentWeatherIcon from '@/components/icons/current-weather-icon';
import { mapWmoToWeather } from '@/lib/utils';

export default function MobileWeatherIcon({
  code,
  isDay = 1,
  className,
}: {
  code: number;
  isDay?: number;
  className?: string;
}) {
  const { icon } = mapWmoToWeather(code, isDay);
  return <CurrentWeatherIcon iconCode={icon} className={className} />;
}
