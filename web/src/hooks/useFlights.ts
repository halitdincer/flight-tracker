import { useQuery } from '@apollo/client/react';
import { GET_LIVE_FLIGHTS, GET_FLIGHTS, GET_FLIGHT } from '../graphql/queries/flights';
import type { LiveFlight, Flight } from '../types/flight';

interface LiveFlightsData {
  liveFlights: LiveFlight[];
}

interface BoundingBox {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
}

export function useLiveFlights(boundingBox?: BoundingBox) {
  const { data, loading, error, refetch } = useQuery<LiveFlightsData>(
    GET_LIVE_FLIGHTS,
    {
      variables: boundingBox ? { boundingBox } : {},
      fetchPolicy: 'network-only',
    }
  );

  return {
    flights: data?.liveFlights ?? [],
    loading,
    error,
    refetch,
  };
}

interface FlightsData {
  flights: {
    nodes: Flight[];
    totalCount: number;
    hasNextPage: boolean;
  };
}

export function useFlights(params: {
  callsign?: string;
  country?: string;
  limit?: number;
  offset?: number;
}) {
  const { data, loading, error, refetch } = useQuery<FlightsData>(GET_FLIGHTS, {
    variables: params,
  });

  return {
    flights: data?.flights.nodes ?? [],
    totalCount: data?.flights.totalCount ?? 0,
    hasNextPage: data?.flights.hasNextPage ?? false,
    loading,
    error,
    refetch,
  };
}

interface FlightData {
  flight: Flight & {
    positions: Array<{
      id: string;
      latitude: number;
      longitude: number;
      altitude: number | null;
      velocity: number | null;
      heading: number | null;
      onGround: boolean;
      recordedAt: string;
    }>;
  };
}

export function useFlight(icao24: string) {
  const { data, loading, error } = useQuery<FlightData>(GET_FLIGHT, {
    variables: { icao24 },
    skip: !icao24,
  });

  return {
    flight: data?.flight ?? null,
    loading,
    error,
  };
}
