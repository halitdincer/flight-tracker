import { useState, useCallback } from 'react';
import { SearchBar, FilterPanel, SearchResults } from '../components/Search';
import { useFlights } from '../hooks/useFlights';

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'China',
  'Japan',
  'Canada',
  'Australia',
  'Netherlands',
  'Switzerland',
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [country, setCountry] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { flights, totalCount, hasNextPage, loading } = useFlights({
    callsign: searchQuery || undefined,
    country: country || undefined,
    limit,
    offset,
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setOffset(0);
  }, []);

  const handleCountryChange = useCallback((newCountry: string) => {
    setCountry(newCountry);
    setOffset(0);
  }, []);

  const handleLoadMore = useCallback(() => {
    setOffset((prev) => prev + limit);
  }, [limit]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Search Flights</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FilterPanel
            country={country}
            onCountryChange={handleCountryChange}
            countries={COUNTRIES}
          />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by callsign (e.g., UAL123)..."
          />
          <SearchResults
            flights={flights}
            loading={loading}
            totalCount={totalCount}
            hasNextPage={hasNextPage}
            onLoadMore={handleLoadMore}
          />
        </div>
      </div>
    </div>
  );
}
