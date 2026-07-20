import { useMemo } from 'react';
import { MapPin, Radar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAppContext } from '@/app/context/AppContext';

const DEFAULT_LOCATION = { latitude: 48.8566, longitude: 2.3522 };

export default function RadarMap() {
  const t = useTranslations('Radar');
  const { location, weatherData, setApiStatus } = useAppContext();
  const latitude = weatherData?.latitude ?? location.lat ?? DEFAULT_LOCATION.latitude;
  const longitude = weatherData?.longitude ?? location.lon ?? DEFAULT_LOCATION.longitude;
  const locationName = weatherData?.name ?? location.name ?? t('defaultLocation');

  const windyUrl = useMemo(() => {
    const params = new URLSearchParams({
      lat: latitude.toFixed(4),
      lon: longitude.toFixed(4),
      detailLat: latitude.toFixed(4),
      detailLon: longitude.toFixed(4),
      zoom: '6',
      level: 'surface',
      overlay: 'radar',
      product: 'radar',
      menu: '',
      message: 'true',
      marker: 'false',
      calendar: '12',
      pressure: '',
      type: 'map',
      location: 'coordinates',
      detail: '',
      metricWind: 'default',
      metricTemp: 'default',
      radarRange: '-1',
    });
    return `https://embed.windy.com/embed2.html?${params.toString()}`;
  }, [latitude, longitude]);

  return (
    <section className="weather-radar-map weather-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border/25 shadow-sm shadow-black/5">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/25 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-card-foreground">
          <Radar className="h-4 w-4 shrink-0 text-chart-2" />
          <span>{t('title')}</span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{locationName}</span>
        </div>
      </div>
      <iframe
        className="min-h-0 w-full flex-1 border-0"
        src={windyUrl}
        title={t('iframeTitle')}
        loading="lazy"
        allowFullScreen
        onLoad={() => setApiStatus('windy', { status: 'operational' })}
        onError={() => setApiStatus('windy', { status: 'outage' })}
      />
    </section>
  );
}
