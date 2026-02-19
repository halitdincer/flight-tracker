export * from './flight';

export interface DailyStatistic {
  id: string;
  date: string;
  totalFlights: number;
  uniqueAircraft: number;
  flightsByCountry: Record<string, number> | null;
  avgAltitude: number | null;
}
