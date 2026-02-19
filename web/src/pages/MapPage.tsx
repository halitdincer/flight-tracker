import { useState } from 'react';
import { FlightMap } from '../components/Map';
import { useLiveFlights } from '../hooks/useFlights';

export default function MapPage() {
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const { flights, loading, refetch } = useLiveFlights();

  return (
    <div className="h-[calc(100vh-64px)]">
      <FlightMap
        flights={flights}
        onRefresh={refetch}
        loading={loading}
        selectedFlight={selectedFlight}
        onFlightSelect={setSelectedFlight}
      />
    </div>
  );
}
