export interface SavedLocation {
  name: string | null;
  lat: number | null;
  lon: number | null;
}

export interface FavoriteLocation extends SavedLocation {
  name: string;
}

export const LOCATION_STORAGE_KEY = 'weather-last-location';
export const FAVORITES_STORAGE_KEY = 'favoriteLocations';
export const FAVORITES_CHANGED_EVENT = 'weather-favorites-changed';

export function hasValidCoordinates(lat: unknown, lon: unknown): lat is number {
  return typeof lat === 'number' && Number.isFinite(lat) && Math.abs(lat) <= 90 &&
    typeof lon === 'number' && Number.isFinite(lon) && Math.abs(lon) <= 180;
}

export function parseSavedLocation(value: unknown): SavedLocation | null {
  if (!value || typeof value !== 'object') return null;
  const { name, lat, lon } = value as SavedLocation;
  const cleanName = typeof name === 'string' ? name.trim() : null;
  if (hasValidCoordinates(lat, lon)) return { name: cleanName || null, lat, lon };
  if (cleanName && lat === null && lon === null) return { name: cleanName, lat: null, lon: null };
  return null;
}

export function locationKey(location: SavedLocation): string {
  return hasValidCoordinates(location.lat, location.lon)
    ? `${location.lat},${location.lon}` : `name:${location.name}`;
}

export function parseFavorites(value: unknown): FavoriteLocation[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, FavoriteLocation>();
  for (const item of value) {
    // Retain legacy name-only favorites; newly saved places include coordinates.
    const location = parseSavedLocation(typeof item === 'string' ? { name: item, lat: null, lon: null } : item);
    if (location?.name) unique.set(locationKey(location), { ...location, name: location.name });
  }
  return [...unique.values()];
}

export function readSavedLocation(): SavedLocation | null {
  try {
    return parseSavedLocation(JSON.parse(localStorage.getItem(LOCATION_STORAGE_KEY) || 'null'));
  } catch {
    return null;
  }
}

export function resolveLegacyFavorite(favorites: FavoriteLocation[], requestedName: string | null, resolved: SavedLocation): FavoriteLocation[] {
  if (!hasValidCoordinates(resolved.lat, resolved.lon)) return favorites;
  return parseFavorites(favorites.map((item) => item.lat === null && item.name === requestedName
    ? { ...item, lat: resolved.lat, lon: resolved.lon } : item));
}

export function readFavorites(): FavoriteLocation[] {
  try {
    return parseFavorites(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]'));
  } catch {
    return [];
  }
}
