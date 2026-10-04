import { RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useAppContext } from '@/app/context/AppContext';
import { Button } from '@/components/ui/button';

export default function RefreshStatus({ className = '' }: { className?: string }) {
  const t = useTranslations('Refresh');
  const locale = useLocale();
  const { weatherData, lastUpdatedAt, isLoading, error, refreshData } = useAppContext();
  if (!weatherData) return null;
  const time = lastUpdatedAt === null ? '' : new Intl.DateTimeFormat(locale, {
    hour: '2-digit', minute: '2-digit',
  }).format(lastUpdatedAt);

  return (
    <div className={`weather-refresh-status flex shrink-0 items-center justify-between gap-2 text-xs text-muted-foreground ${className}`}>
      <p role="status" aria-live="polite">
        {isLoading ? t('refreshing') : error?.source === 'weather' || error?.source === 'geocoding'
          ? t('showingPrevious', { location: weatherData.name ?? '', time })
          : t('updatedAt', { time })}
      </p>
      <Button size="sm" variant="ghost" type="button" onClick={refreshData} disabled={isLoading}>
        <RefreshCw className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
        {t('refresh')}
      </Button>
    </div>
  );
}
