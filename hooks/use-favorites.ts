import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  FAVORITES_STORAGE_KEY, FAVORITES_CHANGED_EVENT, readFavorites,
  locationKey, type FavoriteLocation,
} from '@/lib/location-preferences';

export const useFavorites = () => {
  const t = useTranslations('Toasts');
  const [favorites, setFavorites] = useState<FavoriteLocation[]>(readFavorites);

  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    const onStorage = (event: StorageEvent) => {
      if (event.key === FAVORITES_STORAGE_KEY || event.key === null) sync();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, sync);
    };
  }, []);

  const saveFavorites = useCallback((items: FavoriteLocation[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
      setFavorites(items);
      window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
      return true;
    } catch {
      toast.error(t('saveFavoriteError'));
      return false;
    }
  }, [t]);

  const addFavorite = useCallback((place: FavoriteLocation) => {
    const items = readFavorites();
    if (items.some((item) => locationKey(item) === locationKey(place))) {
      toast.info(t('addFavoriteInfo', { location: place.name }));
    } else if (saveFavorites([...items, place])) {
      toast.success(t('addFavoriteSuccess', { location: place.name }));
    }
  }, [saveFavorites, t]);

  const removeFavorite = useCallback((place: FavoriteLocation) => {
    if (saveFavorites(readFavorites().filter((item) => locationKey(item) !== locationKey(place)))) {
      toast.info(t('removeFavoriteInfo', { location: place.name }));
    }
  }, [saveFavorites, t]);

  return { favorites, addFavorite, removeFavorite };
};
