import { RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useAppContext } from '@/app/context/AppContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function RefreshControl() {
  const t = useTranslations('Refresh');
  const locale = useLocale();
  const { weatherData, lastUpdatedAt, isLoading, error, refreshData } = useAppContext();
  if (!weatherData) return null;
  const time = lastUpdatedAt === null ? '--:--' : new Intl.DateTimeFormat(locale, {
    hour: '2-digit', minute: '2-digit',
  }).format(lastUpdatedAt);
  const status = isLoading ? t('refreshing') : error?.source === 'weather' || error?.source === 'geocoding'
    ? t('showingPrevious', { location: weatherData.name ?? '', time }) : t('updatedAt', { time });
  const tooltip = isLoading ? status : `${status} · ${t('refresh')}`;

  return (
    <>
      <Tooltip delayDuration={250}>
        <TooltipTrigger asChild>
          <button className="weather-refresh-control" type="button" onClick={refreshData}
            disabled={isLoading} aria-label={tooltip} aria-busy={isLoading}>
            <RefreshCw className={isLoading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" />
            <span className="tabular-nums">{time}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>{tooltip}</TooltipContent>
      </Tooltip>
      <span className="sr-only" role="status" aria-live="polite">{status}</span>
    </>
  );
}
