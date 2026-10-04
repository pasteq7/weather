import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAppContext } from '@/app/context/AppContext';
import { useFavorites } from '@/hooks/use-favorites';
import { locationKey, type FavoriteLocation } from '@/lib/location-preferences';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function MobileFavorites() {
  const t = useTranslations('TopBar');
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const { weatherData, setLocationBySuggestion, setLocationByName, isLoading } = useAppContext();
  const [open, setOpen] = useState(false);
  const place: FavoriteLocation | null = weatherData?.name && weatherData.latitude !== undefined && weatherData.longitude !== undefined
    ? { name: weatherData.name, lat: weatherData.latitude, lon: weatherData.longitude } : null;
  const saved = place && favorites.find((item) => locationKey(item) === locationKey(place));

  const select = (item: FavoriteLocation) => {
    if (item.lat !== null && item.lon !== null) setLocationBySuggestion({ name: item.name, lat: item.lat, lon: item.lon });
    else setLocationByName(item.name);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="mobile-search__favorites" type="button" aria-label={t('favoritesTooltip')}>
          <Star aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-2" align="end">
        <h2 className="px-2 py-2 text-sm font-semibold">{t('favoritesTitle')}</h2>
        {place && (
          <Button type="button" variant="outline" className="mb-2 w-full justify-start" disabled={isLoading}
            onClick={() => saved ? removeFavorite(saved) : addFavorite(place)}>
            <Star aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
            {saved ? t('removeFavorite', { location: place.name }) : t('saveCurrentLocation')}
          </Button>
        )}
        {favorites.length === 0 ? <p className="px-2 py-2 text-sm text-muted-foreground">{t('noFavorites')}</p> : (
          <ul className="max-h-60 overflow-y-auto">
            {favorites.map((item) => (
              <li key={locationKey(item)} className="flex items-center gap-1">
                <Button type="button" variant="ghost" className="min-w-0 flex-1 justify-start" onClick={() => select(item)}>
                  <span className="truncate">{item.name}</span>
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label={t('removeFavorite', { location: item.name })}
                  onClick={() => removeFavorite(item)}><X aria-hidden="true" /></Button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
