import { FormEvent, useEffect, useState } from 'react';
import { LocateFixed, Search } from 'lucide-react';
import type { MobileLabels } from './mobile-types';

export default function MobileSearch({
  currentLocation,
  labels,
  onLocate,
  onSearch,
}: {
  currentLocation: string;
  labels: MobileLabels;
  onLocate: () => void;
  onSearch: (location: string) => void;
}) {
  const [query, setQuery] = useState(currentLocation);

  useEffect(() => setQuery(currentLocation), [currentLocation]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextLocation = query.trim();
    if (nextLocation) onSearch(nextLocation);
  };

  return (
    <form className="mobile-search" role="search" onSubmit={handleSubmit}>
      <button className="mobile-search__submit" type="submit" aria-label={labels.search}>
        <Search aria-hidden="true" />
      </button>
      <input
        aria-label={labels.search}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={labels.search}
        autoComplete="off"
      />
      <button type="button" aria-label={labels.locate} onClick={onLocate}>
        <LocateFixed aria-hidden="true" />
      </button>
    </form>
  );
}
