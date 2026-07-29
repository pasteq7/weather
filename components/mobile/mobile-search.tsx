import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { LocateFixed, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { LocationSuggestion, searchLocationSuggestions } from '@/lib/api';
import type { MobileLabels } from './mobile-types';

export default function MobileSearch({
  currentLocation,
  labels,
  onLocate,
  onSearch,
  onSuggestion,
}: {
  currentLocation: string;
  labels: MobileLabels;
  onLocate: () => void;
  onSearch: (location: string) => void;
  onSuggestion: (suggestion: { name: string; lat: number; lon: number }) => void;
}) {
  const locale = useLocale();
  const t = useTranslations();
  const listId = useId();
  const [query, setQuery] = useState(currentLocation);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const suppressNextSearchRef = useRef(false);

  useEffect(() => setQuery(currentLocation), [currentLocation]);

  useEffect(() => {
    const searchTerm = query.trim();

    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false;
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
      setIsSearching(false);
      return;
    }

    if (searchTerm.length < 3 || searchTerm === currentLocation.trim()) {
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocationSuggestions(searchTerm, locale, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setActiveSuggestionIndex(-1);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Location suggestion search failed:', error);
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [currentLocation, locale, query]);

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    suppressNextSearchRef.current = true;
    setQuery(suggestion.label);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    onSuggestion({
      name: suggestion.label,
      lat: suggestion.latitude,
      lon: suggestion.longitude,
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
      selectSuggestion(suggestions[activeSuggestionIndex]);
      return;
    }

    const nextLocation = query.trim();
    if (nextLocation) onSearch(nextLocation);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestionIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestionIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Escape') {
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
    }
  };

  return (
    <form className="mobile-search" role="search" onSubmit={handleSubmit}>
      <button className="mobile-search__submit" type="submit" aria-label={labels.search}>
        <Search aria-hidden="true" />
      </button>
      <input
        aria-label={labels.search}
        value={query}
        onChange={(event) => {
          suppressNextSearchRef.current = false;
          setQuery(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={labels.search}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
        aria-controls={listId}
        aria-activedescendant={activeSuggestionIndex >= 0 ? `${listId}-${activeSuggestionIndex}` : undefined}
      />
      <button type="button" aria-label={labels.locate} onClick={onLocate}>
        <LocateFixed aria-hidden="true" />
      </button>
      {(suggestions.length > 0 || isSearching) && (
        <div className="mobile-search__suggestions" id={listId} role="listbox">
          {isSearching && suggestions.length === 0 ? (
            <p>{t('TopBar.searchingLocations')}</p>
          ) : suggestions.map((suggestion, index) => (
            <button
              className="mobile-search__suggestion"
              data-active={activeSuggestionIndex === index}
              id={`${listId}-${index}`}
              key={`${suggestion.latitude}-${suggestion.longitude}`}
              type="button"
              role="option"
              aria-selected={activeSuggestionIndex === index}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
