export interface Flight {
  id: string;
  icao24: string;
  callsign: string | null;
  originCountry: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface FlightPosition {
  id: string;
  flightId?: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  velocity: number | null;
  heading: number | null;
  verticalRate?: number | null;
  onGround: boolean;
  recordedAt: string;
}

export interface LiveFlight {
  icao24: string;
  callsign: string | null;
  originCountry: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  velocity: number | null;
  heading: number | null;
  onGround: boolean;
  category: number | null;
}
