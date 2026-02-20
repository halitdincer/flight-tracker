import { useEffect, useState } from 'react';
import { FlightMap } from '../components/Map';
import { useLiveFlights } from '../hooks/useFlights';

const RATE_LIMIT_WARNING =
  'OpenSky rate limit reached. No cached flights are available right now.';

const isRateLimitMessage = (message: string | null | undefined) =>
  Boolean(message && /rate limit/i.test(message) && /opensky/i.test(message));

export default function MapPage() {
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [geolocateRequest, setGeolocateRequest] = useState(0);
  const [, setTick] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const { flights, loading, error, refetch } = useLiveFlights();

  useEffect(() => {
    if (!loading && !error) {
      setLastUpdatedAt((previous) => previous || new Date());
    }
  }, [loading, error]);

  // Tick every minute to update relative time
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshError(null);
    setRefreshing(true);
    try {
      await refetch();
      setLastUpdatedAt(new Date());
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

  const errorMessage = refreshError || queryError;
  const isRateLimitWarning = isRateLimitMessage(errorMessage);

  const lastUpdatedText = lastUpdatedAt
    ? (() => {
        const elapsedMinutes = Math.floor(
          (Date.now() - lastUpdatedAt.getTime()) / 60_000
        );
        if (elapsedMinutes >= 24 * 60) return 'more than 24 hours ago';
        if (elapsedMinutes >= 60) {
          const hours = Math.floor(elapsedMinutes / 60);
          return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        }
        const minutes = Math.max(elapsedMinutes, 1);
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
      })()
    : null;

  return (
    <div className="relative h-full">
      {/* Error / rate-limit banner */}
      {errorMessage && (
        <div
          className={`absolute left-1/2 top-3 z-30 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow md:top-4 ${
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
        panelOpen={panelOpen}
        onPanelToggle={() => setPanelOpen((open) => !open)}
        onRefresh={handleRefresh}
        onGeolocate={() => setGeolocateRequest((v) => v + 1)}
        refreshing={loading || refreshing}
        geolocateRequest={geolocateRequest}
        selectedFlight={selectedFlight}
        onFlightSelect={setSelectedFlight}
      />

      {/* Last updated — bottom left */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-20 p-3 md:p-4"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
        }}
      >
        <div className="rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
          {flights.length.toLocaleString()} flights
          {lastUpdatedText ? ` · ${lastUpdatedText}` : ''}
        </div>
      </div>
    </div>
  );
}
