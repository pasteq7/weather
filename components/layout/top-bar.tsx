// components/layout/top-bar.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useFavorites } from '@/hooks/use-favorites';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sun, Moon, Star, Locate, X, ChevronDown, Clock, Settings, Search } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useAppContext } from '@/app/context/AppContext';
import { Locale } from '@/i18n-config';
import { useLanguage } from '@/app/context/LanguageProvider';
import { cn } from '@/lib/utils';
import type { MeteoconStyle } from '@/lib/meteocons';

interface SimplePosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

export default function TopBar() {
  const t = useTranslations();
  const { locale, setLocale } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const {
    location,
    units,
    iconStyle,
    weatherData,
    setUnits,
    setIconStyle,
    setLocationByName,
    setLocationByCoords,
    refreshData,
    isInitializing,
    finishInitialization,
    setApiStatus,
    reportError
  } = useAppContext();

  const [locationInput, setLocationInput] = useState('');
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  const isSearchableLocation = location.name &&
    location.name !== (t('Weather.currentLocation') || 'Current Location') &&
    location.name !== (t('Weather.unknownLocation') || 'Unknown Location');

  useEffect(() => {
    const interval = setInterval(() => {
      if (location.name || (location.lat !== null && location.lon !== null)) {
        refreshData();
      }
    }, 3600000);

    return () => clearInterval(interval);
  }, [location, refreshData]);

  useEffect(() => {
    if (!weatherData?.timezone) {
      setCurrentTime(null);
      return;
    }

    const updateTime = () => {
      try {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {
          timeZone: weatherData.timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: units === 'imperial'
        });
        setCurrentTime(timeString);
      } catch {
        console.error("Error formatting time for timezone:", weatherData.timezone);
        setCurrentTime(null);
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [weatherData?.timezone, units]);

  const handleGeolocate = useCallback(async (isAuto = false) => {
    if (isGeolocating) return;

    setIsGeolocating(true);

    const promise = async (): Promise<SimplePosition> => {
      if (Capacitor.isNativePlatform()) {
        const permissions = await Geolocation.requestPermissions();
        if (permissions.location !== 'granted') {
          throw new Error('Location permission denied');
        }
        return Geolocation.getCurrentPosition({
          timeout: 10000,
          enableHighAccuracy: false
        });
      }

      if (navigator.geolocation) {
        return new Promise<SimplePosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos as SimplePosition),
            (error) => {
              let message = 'Geolocation failed';
              if (error.code === error.PERMISSION_DENIED) message = 'Location permission denied';
              else if (error.code === error.POSITION_UNAVAILABLE) message = 'Location unavailable';
              else if (error.code === error.TIMEOUT) message = 'Location request timeout';
              reject(new Error(message));
            },
            { timeout: 10000, enableHighAccuracy: false }
          );
        });
      }

      throw new Error('Geolocation not supported');
    };

    toast.promise(promise(), {
      loading: isAuto ? t('Toasts.gettingLocationAuto') : t('Toasts.gettingLocation'),
      success: (position) => {
        if (isAuto) finishInitialization();
        setApiStatus('geolocation', { status: 'operational' });
        reportError(null);
        setLocationByCoords(position.coords.latitude, position.coords.longitude);
        setIsGeolocating(false);
        return t('Toasts.locationFound');
      },
      error: (err: Error) => {
        if (isAuto) finishInitialization();
        setApiStatus('geolocation', { status: 'outage' });
        console.error("Geolocation failed:", err);
        setIsGeolocating(false);
        if (err.message.includes('denied') || err.message.includes('permission')) {
          const message = t('Toasts.locationDenied');
          if (!isAuto) reportError({ code: 'ERROR_GEOLOCATION_DENIED', message });
          return message;
        }
        const message = isAuto ? t('Toasts.locationErrorAuto') : t('Toasts.locationError');
        if (!isAuto) reportError({ code: 'ERROR_GEOLOCATION_UNAVAILABLE', message });
        return message;
      },
    });
  }, [isGeolocating, finishInitialization, setLocationByCoords, t, setApiStatus, reportError]);

  useEffect(() => {
    if (isInitializing) {
      handleGeolocate(true);
    }
  }, [isInitializing, handleGeolocate]);

  useEffect(() => {
    setLocationInput(location.name || '');
  }, [location.name]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchTerm = locationInput.trim();
    if (searchTerm) {
      setLocationByName(searchTerm);
    }
  };

  const handleUnitsChange = (value: 'metric' | 'imperial') => {
    if (value) setUnits(value);
  };

  const handleIconStyleChange = (value: string) => {
    if (value) setIconStyle(value as MeteoconStyle);
  };

  const handleLangChange = (value: string) => {
    const newLocale = value as Locale;
    if (newLocale && newLocale !== locale) {
      setLocale(newLocale);
    }
  };

  const handleThemeToggle = () => {
    const activeTheme = theme === 'system' ? resolvedTheme : theme;
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';

    setTheme(nextTheme);
    setIconStyle(nextTheme === 'light' ? 'monochrome' : 'line');
  };

  const handleFavoriteSelect = (fav: string) => {
    setLocationByName(fav);
  };

  return (
    <div className="weather-top-bar flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      {currentTime && (
        <div className="weather-top-bar__time weather-surface hidden items-center gap-1.5 whitespace-nowrap rounded-md border border-border/25 px-2.5 text-sm font-semibold tabular-nums text-muted-foreground backdrop-blur-sm md:flex md:h-9">
          <Clock className="h-3.5 w-3.5 text-chart-2" />
          {currentTime}
        </div>
      )}

      <TooltipProvider>
        <form onSubmit={handleSearch} className="weather-search-form weather-surface flex h-10 min-w-0 flex-1 items-center gap-1 rounded-md border border-border/40 shadow-sm shadow-black/5 backdrop-blur-md sm:h-9">
          <Button className="h-10 w-10 rounded-r-none sm:h-9 sm:w-9" variant="ghost" size="icon" type="submit" aria-label={t('TopBar.searchPlaceholder')}>
            <Search className="h-4 w-4" />
          </Button>

          <Input
            className="h-10 flex-1 border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0 sm:h-9 sm:text-sm"
            placeholder={t('TopBar.searchPlaceholder')}
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button className="h-10 w-10 rounded-l-none sm:h-9 sm:w-9" variant="ghost" size="icon" aria-label={t('TopBar.favoritesTooltip')}><ChevronDown className="h-4 w-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="grid gap-4">
                <h4 className="font-medium text-muted-foreground leading-none">{t('TopBar.favoritesTitle')}</h4>
                {favorites.length > 0 ? (
                  <ul className="grid gap-2">
                    {favorites.map(fav => (
                      <li key={fav} className="flex items-center justify-between">
                        <Button variant="link" className="p-0 h-auto" onClick={() => handleFavoriteSelect(fav)}>{fav}</Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFavorite(fav)}><X className="h-4 w-4" /></Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('TopBar.noFavorites')}</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </form>

        <div className={cn(
          "weather-top-bar__actions",
          "grid h-10 items-center gap-2 sm:flex sm:h-9 sm:justify-end",
          isSearchableLocation ? "grid-cols-4" : "grid-cols-3"
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="h-10 w-full sm:h-9 sm:w-9" type="button" variant="outline" size="icon" onClick={() => handleGeolocate(false)} disabled={isGeolocating}>
                <Locate className={`h-4 w-4 ${isGeolocating ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{isGeolocating ? t('TopBar.gettingLocationTooltip') : t('TopBar.myLocationTooltip')}</p></TooltipContent>
          </Tooltip>

          {isSearchableLocation && (
            <Tooltip>
              <TooltipTrigger asChild><Button className="h-10 w-full sm:h-9 sm:w-9" variant="outline" size="icon" onClick={() => addFavorite(location.name!)}><Star className="h-4 w-4" /></Button></TooltipTrigger>
              <TooltipContent><p>{t('TopBar.addFavoriteTooltip')}</p></TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild><Button className="h-10 w-full sm:h-9 sm:w-9" variant="outline" size="icon" onClick={handleThemeToggle}><Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /><Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" /></Button></TooltipTrigger>
            <TooltipContent><p>{t('TopBar.toggleThemeTooltip')}</p></TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild><DropdownMenuTrigger asChild><Button className="h-10 w-full sm:h-9 sm:w-9" variant="outline" size="icon"><Settings className="h-4 w-4" /></Button></DropdownMenuTrigger></TooltipTrigger>
              <TooltipContent><p>{t('TopBar.settingsTooltip')}</p></TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">{t('TopBar.unitsLabel')}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={units} onValueChange={(v) => handleUnitsChange(v as 'metric' | 'imperial')}>
                <DropdownMenuRadioItem value="metric">{t('TopBar.celsiusTooltip')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="imperial">{t('TopBar.fahrenheitTooltip')}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">{t('TopBar.iconStyleLabel')}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={iconStyle} onValueChange={handleIconStyleChange}>
                <DropdownMenuRadioItem value="line">{t('TopBar.iconStyleLine')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="fill">{t('TopBar.iconStyleFill')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="monochrome">{t('TopBar.iconStyleMonochrome')}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">{t('TopBar.languageLabel')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleLangChange('en')} disabled={locale === 'en'}>{t('TopBar.english')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLangChange('fr')} disabled={locale === 'fr'}>{t('TopBar.french')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>
    </div>
  );
}
