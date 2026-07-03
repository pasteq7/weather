'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string | null;
  isRetrying?: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  showInline?: boolean;
}

export default function ErrorDisplay({
  error,
  isRetrying = false,
  onDismiss,
  onRetry,
  showInline = false,
}: ErrorDisplayProps) {
  const t = useTranslations('Errors');
  const lastToastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!error) {
      lastToastRef.current = null;
      return;
    }

    if (lastToastRef.current !== error) {
      toast.error(error);
      lastToastRef.current = error;
    }
  }, [error]);

  if (!error || !showInline) return null;

  return (
    <div className="weather-error-banner shrink-0 px-0">
      <div className="weather-surface flex min-w-0 flex-col gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm shadow-sm shadow-black/5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2 text-destructive sm:items-center">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
          <p className="min-w-0 font-medium leading-5 text-destructive">{error}</p>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1.5">
          {onRetry && (
            <Button size="sm" variant="outline" type="button" onClick={onRetry} disabled={isRetrying}>
              <RefreshCw className={isRetrying ? 'animate-spin' : ''} />
              {t('retry')}
            </Button>
          )}
          {onDismiss && (
            <Button size="icon" variant="ghost" type="button" onClick={onDismiss} aria-label={t('dismiss')}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
