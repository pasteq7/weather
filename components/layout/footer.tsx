// components/layout/footer.tsx
import { Github, Cloud } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAppContext, ApiStatus } from '@/app/context/AppContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface FooterProps {
  activeView?: 'weather' | 'radar';
}

export default function Footer({ activeView = 'weather' }: FooterProps) {
  const t = useTranslations('Footer');
  const { apiStatus } = useAppContext();

  // Determines the overall system status based on individual API statuses
  const getGeneralStatus = (): ApiStatus => {
    const statuses = [
      apiStatus.geolocation,
      apiStatus.openMeteo,
      apiStatus.reverseGeo,
      ...(activeView === 'radar' ? [apiStatus.windy] : []),
    ];
    if (statuses.some(s => s.status === 'outage')) {
      return { status: 'outage' };
    }
    if (statuses.some(s => s.status === 'pending')) {
      return { status: 'pending' };
    }
    return { status: 'operational' };
  };

  const generalStatus = getGeneralStatus();

  // A small component for displaying individual API statuses within the tooltip
  const DetailedStatus = ({ status, label }: { status: ApiStatus, label: string }) => (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={cn(
          "h-2 w-2 rounded-full",
          status.status === 'operational' && 'bg-success',
          status.status === 'outage' && 'bg-destructive',
          status.status === 'pending' && 'bg-muted-foreground'
        )} />
        <span className="text-sm capitalize text-muted-foreground">{t(status.status)}</span>
      </div>
    </div>
  );

  return (
    <footer className="weather-footer w-full">
      <Card className="weather-footer-card weather-surface w-full border-border/25 px-3 py-2 text-muted-foreground/75 shadow-none sm:px-4 sm:py-3">
        <div className="flex justify-between items-center gap-2 min-w-0">
        
        <div className="flex items-center gap-4">
          <Cloud className="h-4 w-4 opacity-65" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1.5 flex-shrink-0 cursor-help">
                <span className="text-xs hidden sm:inline whitespace-nowrap opacity-80">{t('apiStatus')}</span>
                 <span className={cn(
                  "h-1.5 w-1.5 rounded-full flex-shrink-0",
                  generalStatus.status === 'operational' && 'bg-success',
                  generalStatus.status === 'outage' && 'bg-destructive animate-pulse',
                  generalStatus.status === 'pending' && 'bg-muted-foreground' 
                )} />
              </TooltipTrigger>
              <TooltipContent className="p-3">
                <div className="flex flex-col gap-2">
                  <DetailedStatus status={apiStatus.geolocation} label={t('geolocationApi')} />
                  <DetailedStatus status={apiStatus.openMeteo} label={t('weatherApi')} />
                  <DetailedStatus status={apiStatus.reverseGeo} label={t('geocodingApi')} />
                  {activeView === 'radar' && <DetailedStatus status={apiStatus.windy} label={t('windyApi')} />}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2 md:gap-4 text-xs flex-shrink-0">
          <p className="hidden md:block whitespace-nowrap">
            <span className="hidden lg:inline">{t('dataBy')} </span>
            <a
              href="https://open-meteo.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-muted-foreground/75 underline hover:text-primary"
            >
              Open-Meteo
            </a>
            <span className="mx-1.5">·</span>
            <a
              href="https://www.windy.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/75 underline hover:text-primary"
            >
              Windy
            </a>
          </p>
          
          <p className="hidden xl:block whitespace-nowrap">
            {t('madeBy')} 
            <a
              href="https://sylvainbrehaut.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="ml-1 text-muted-foreground/75 underline hover:text-primary"
            >
              sB
            </a>
          </p>
          
          <a
            href="https://github.com/pasteq7/weather" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex-shrink-0 text-muted-foreground/75 hover:text-primary" 
            aria-label={t('githubAria')}
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
        </div>
      </Card>
    </footer>
  );
}
