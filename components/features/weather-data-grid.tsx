// components/features/weather-data-grid.tsx

'use client';

import DataCard from "./data-card";
import { Card } from "@/components/ui/card";
import { WeatherData } from "@/lib/types";
import { 
  formatHumidity, 
  formatPressure, 
  formatVisibility, 
  formatWindSpeed,
  formatTime 
} from "@/lib/utils";
import { useTranslations } from "next-intl";

interface WeatherDataGridProps {
  weatherData: WeatherData;
  units: string;
}

export default function WeatherDataGrid({ weatherData, units }: WeatherDataGridProps) {
  const t = useTranslations('Weather');
  const { current, daily, hourly, timezone } = weatherData;

  const humidity = formatHumidity(current.relative_humidity_2m);
  const pressure = formatPressure(current.pressure_msl, units);
  
  const now = new Date();
  const currentHourIndex = hourly.time.findIndex(t => {
    const hourDate = new Date(t * 1000);
    return hourDate.getHours() === now.getHours() && hourDate.getDate() === now.getDate();
  });
  const visibilityValue = currentHourIndex !== -1 ? hourly.visibility[currentHourIndex] : hourly.visibility[0];
  const visibility = formatVisibility(visibilityValue, units);
  
  const sunrise = formatTime(new Date(daily.sunrise[0] * 1000), timezone, units);
  const sunset = formatTime(new Date(daily.sunset[0] * 1000), timezone, units);
  const wind = formatWindSpeed(current.wind_speed_10m, units);

  const cardData = [
    { iconType: 'humidity', title: t('humidity'), data: humidity[0], unit: humidity[1] },
    { iconType: 'wind', title: t('windSpeed'), data: wind[0], unit: wind[1] },
    { iconType: 'pressure', title: t('pressure'), data: pressure[0], unit: pressure[1] },
    { iconType: 'visibility', title: t('visibility'), data: visibility[0], unit: visibility[1] },
    { iconType: 'sunrise', title: t('sunrise'), data: sunrise },
    { iconType: 'sunset', title: t('sunset'), data: sunset },
  ];

  return (
    <Card className="weather-data-grid weather-surface grid grid-cols-3 gap-px overflow-hidden rounded-lg border-border/25 bg-border/35 p-px shadow-none min-[72rem]:grid-cols-6">
      {cardData.map((card) => (
        <DataCard key={card.title} {...card} />
      ))}
    </Card>
  );
}
