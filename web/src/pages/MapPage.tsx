import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { FlightMap } from '../components/Map';
import { useFlights, useLiveFlights } from '../hooks/useFlights';

const RATE_LIMIT_WARNING =
  'OpenSky rate limit reached. No cached flights are available right now.';

const isRateLimitMessage = (message: string | null | undefined) =>
  Boolean(message && /rate limit/i.test(message) && /opensky/i.test(message));

export default function MapPage() {
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [geolocateRequest, setGeolocateRequest] = useState(0);
  const [, setTick] = useState(0);
  const [searchCallsign, setSearchCallsign] = useState('');
  const [searchCountry, setSearchCountry] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const { flights, loading, error, refetch } = useLiveFlights();
  const {
    flights: searchResults,
    loading: searchLoading,
    error: searchError,
  } = useFlights({
    callsign: searchCallsign || undefined,
    country: searchCountry || undefined,
    limit: 20,
    offset: 0,
  });

  const countryOptions = useMemo(
    () => ['United States', 'United Kingdom', 'Germany', 'France', 'Turkey', 'Canada', 'Spain'],
    []
  );

  const isIosSafari = useMemo(() => {
    if (typeof navigator === 'undefined') return false;

    const ua = navigator.userAgent;
    const isIosDevice = /iP(ad|hone|od)/.test(ua);
    const isSafariEngine = /Safari/i.test(ua);
    const isOtherIosBrowser = /(CriOS|FxiOS|EdgiOS|OPiOS)/.test(ua);

    return isIosDevice && isSafariEngine && !isOtherIosBrowser;
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      setLastUpdatedAt((previous) => previous || new Date());
    }
  }, [loading, error]);

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

  const errorMessage =
    refreshError ||
    queryError;

  const isRateLimitWarning = isRateLimitMessage(errorMessage);
  const lastUpdatedText = lastUpdatedAt
    ? (() => {
        const elapsedMinutes = Math.floor((Date.now() - lastUpdatedAt.getTime()) / 60_000);
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
      {errorMessage && (
        <div
          className={`absolute left-1/2 top-20 z-30 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow md:top-4 ${
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
        onPanelToggle={() => setPanelOpen((open) => !open)}
        panelOpen={panelOpen}
        iosSafari={isIosSafari}
        geolocateRequest={geolocateRequest}
        selectedFlight={selectedFlight}
        onFlightSelect={setSelectedFlight}
      />

      {panelOpen && (
        <aside
          className="absolute bottom-20 right-3 z-20 max-h-[65vh] w-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur md:bottom-5 md:right-4 md:w-[360px] md:max-h-[70vh]"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Flight Tracker</h2>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">
                {flights.length.toLocaleString()} flights
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Hide
              </button>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                title="Refresh flight data"
              >
                <svg
                  className={`h-5 w-5 ${(loading || refreshing) ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                onClick={() => setGeolocateRequest((value) => value + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                title="Go to my location"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <div className="text-xs font-medium text-slate-600">
                {lastUpdatedText ? `Updated ${lastUpdatedText}` : 'No updates yet'}
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">Map</span>
            <Link
              to="/dashboard"
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              Dashboard
            </Link>
            <Link
              to="/search"
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              Advanced Search
            </Link>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Callsign</label>
              <input
                value={searchCallsign}
                onChange={(event) => setSearchCallsign(event.target.value)}
                placeholder="e.g. THY"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-400 placeholder:text-slate-400 focus:ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Country</label>
              <select
                value={searchCountry}
                onChange={(event) => setSearchCountry(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-400 focus:ring"
              >
                <option value="">All countries</option>
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="mb-2 text-xs font-medium text-slate-600">Search results</p>
              {searchLoading ? (
                <p className="text-sm text-slate-500">Searching...</p>
              ) : searchError ? (
                <p className="text-sm text-red-600">Could not load search results.</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-slate-500">No matching flights right now.</p>
              ) : (
                <div className="space-y-2">
                  {searchResults.slice(0, 6).map((flight) => (
                    <div key={flight.id} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">{flight.callsign || flight.icao24}</p>
                        <Link
                          to={`/flight/${flight.icao24}`}
                          className="text-xs font-medium text-sky-700 hover:underline"
                        >
                          Details
                        </Link>
                      </div>
                      <p className="text-xs text-slate-500">{flight.originCountry}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
