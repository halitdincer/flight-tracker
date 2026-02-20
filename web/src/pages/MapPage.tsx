import { useState } from 'react';
import { FlightMap } from '../components/Map';
import { useLiveFlights } from '../hooks/useFlights';

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
    } catch {
      setRefreshError('Failed to refresh flight data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const errorMessage =
    refreshError ||
    (error ? 'Unable to load live flight data from the API.' : null);

  return (
    <div className="relative h-[calc(100vh-64px)]">
      {errorMessage && (
        <div className="absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 shadow">
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
