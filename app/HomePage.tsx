import { useAppContext } from '@/app/context/AppContext';
import TodayWeatherCard from '@/components/features/today-weather-card';
import WeatherDataGrid from '@/components/features/weather-data-grid';
import ForecastView from '@/components/features/forecast-view';
import ErrorDisplay from '@/components/features/error-display';
import LoadingSkeleton from '@/app/Loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Footer from '@/components/layout/footer';
import RadarMap from '@/components/features/radar-map';
import { AlertTriangle, RefreshCw, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

interface HomePageProps {
  activeView: 'weather' | 'radar';
}

export default function HomePage({ activeView }: HomePageProps) {
  const t = useTranslations();
  const { weatherData, units, isLoading, error, isInitializing, refreshData, reportError } = useAppContext();

  const showSkeleton = isInitializing || (isLoading && !weatherData);

  if (activeView === 'radar') {
    return (
      <main className="min-h-0 overflow-hidden">
        <div className="weather-radar-dashboard flex h-full min-h-0 flex-col gap-2.5 overflow-hidden pb-1 pr-1 min-[72rem]:pr-0">
          <RadarMap />
          <Footer activeView="radar" />
        </div>
      </main>
    );
  }

  return (
    <>
      {showSkeleton ? (
        <LoadingSkeleton />
      ) : error && !weatherData ? (
        <StateCard
          icon={<AlertTriangle className="h-5 w-5" />}
          title={error.title}
          description={error.message}
          detail={error.detail}
          diagnostics={[
            `${t('Errors.failed')}: ${t(`Errors.source.${error.source}`)}`,
            `${t('Errors.reasonLabel')}: ${t(`Errors.reason.${error.reason}`)}`,
            `${t('Errors.code')}: ${error.code}`,
            ...(error.status ? [`${t('Errors.status')}: ${error.status}`] : []),
          ]}
          actionLabel={error.canRetry ? t('Errors.retry') : undefined}
          isBusy={isLoading}
          onAction={error.canRetry ? refreshData : undefined}
          tone="destructive"
        />
      ) : weatherData ? (
        <main className="min-h-0 overflow-hidden">
          <div className="weather-dashboard flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto overscroll-contain pb-1 pr-1 min-[72rem]:overflow-hidden min-[72rem]:pr-0">
            <ErrorDisplay
              error={error}
              isRetrying={isLoading}
              onDismiss={() => reportError(null)}
              onRetry={refreshData}
              showInline={Boolean(error)}
            />
            <div className="weather-summary-grid grid min-h-0 shrink-0 grid-cols-1 gap-2.5 min-[50rem]:grid-cols-[minmax(18rem,0.86fr)_minmax(0,1.6fr)]">
              <div className="flex min-h-0 flex-col">
                <TodayWeatherCard weatherData={weatherData} units={units} location={weatherData.name} />
              </div>
              <div className="weather-right-column flex min-h-0 flex-col gap-2.5">
                <WeatherDataGrid weatherData={weatherData} units={units} />
                <ForecastView type="hourly" weatherData={weatherData} units={units} />
              </div>
            </div>
            <ForecastView type="daily" weatherData={weatherData} units={units} />
            <Footer />
          </div>
        </main>
      ) : (
        <StateCard
          icon={<Search className="h-5 w-5" />}
          title={t('Weather.noLocationTitle')}
          description={t('Weather.noLocationDescription')}
        />
      )}
    </>
  );
}

function StateCard({
  icon,
  title,
  description,
  detail,
  diagnostics,
  actionLabel,
  isBusy = false,
  onAction,
  tone = 'default',
}: {
  icon: ReactNode;
  title: string;
  description: string;
  detail?: string;
  diagnostics?: string[];
  actionLabel?: string;
  isBusy?: boolean;
  onAction?: () => void;
  tone?: 'default' | 'destructive';
}) {
  return (
    <main className="flex min-h-0 items-center justify-center overflow-y-auto p-2 sm:p-4">
      <Card className="weather-surface w-full max-w-md rounded-lg border-border/25 px-4 py-5 text-center shadow-none sm:px-6 sm:py-7">
        <CardContent className="flex flex-col items-center gap-3 p-0">
          <div
            className={
              tone === 'destructive'
                ? 'flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive'
                : 'flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'
            }
          >
            {icon}
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
            <p className="text-sm font-medium leading-6 text-muted-foreground">{description}</p>
            {diagnostics && diagnostics.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 pt-1 text-[0.68rem] font-semibold leading-4 text-muted-foreground">
                {diagnostics.map((item) => (
                  <span key={item} className="rounded border border-border/25 bg-background/15 px-1.5 py-0.5">{item}</span>
                ))}
              </div>
            )}
            {detail && <p className="text-xs font-medium leading-5 text-muted-foreground/80">{detail}</p>}
          </div>
          {actionLabel && onAction && (
            <Button className="mt-1" type="button" onClick={onAction} disabled={isBusy}>
              <RefreshCw className={isBusy ? 'animate-spin' : ''} />
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
