import { useState } from 'react';
import { FlightMap } from '../components/Map';
import { useLiveFlights } from '../hooks/useFlights';

const RATE_LIMIT_WARNING =
  'OpenSky rate limit reached. No cached flights are available right now.';

const isRateLimitMessage = (message: string | null | undefined) =>
  Boolean(message && /rate limit/i.test(message) && /opensky/i.test(message));

export default function MapPage() {
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const { flights, loading, error, refetch } = useLiveFlights();

  const handleRefresh = async () => {
    setRefreshError(null);
    setRefreshing(true);
    try {
      await refetch();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Unknown error';
      setRefreshError(
        isRateLimitMessage(message)
          ? RATE_LIMIT_WARNING
          : 'Failed to refresh flight data. Please try again.'
      );
    } finally {
      setRefreshing(false);
    }
  };

  const queryErrorMessage = error?.message;
  const queryError = queryErrorMessage
    ? isRateLimitMessage(queryErrorMessage)
      ? RATE_LIMIT_WARNING
      : 'Unable to load live flight data from the API.'
    : null;

  const errorMessage =
    refreshError ||
    queryError;

  const isRateLimitWarning = isRateLimitMessage(errorMessage);

  return (
    <div className="relative h-[calc(100vh-64px)]">
      {errorMessage && (
        <div
          className={`absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow ${
            isRateLimitWarning
              ? 'border border-amber-300 bg-amber-50 text-amber-900'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {errorMessage}
        </div>
      )}
      <FlightMap
        flights={flights}
        onRefresh={handleRefresh}
        loading={loading || refreshing}
        selectedFlight={selectedFlight}
        onFlightSelect={setSelectedFlight}
      />
    </div>
  );
}
