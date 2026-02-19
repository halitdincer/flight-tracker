import { Link } from 'react-router-dom';
import type { Flight } from '../../types/flight';
import { format, parseISO } from 'date-fns';

interface SearchResultsProps {
  flights: Flight[];
  loading: boolean;
  totalCount: number;
  hasNextPage: boolean;
  onLoadMore: () => void;
}

export default function SearchResults({
  flights,
  loading,
  totalCount,
  hasNextPage,
  onLoadMore,
}: SearchResultsProps) {
  if (loading && flights.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No flights found. Try adjusting your search criteria.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Showing {flights.length} of {totalCount.toLocaleString()} flights
      </p>
      <div className="space-y-3">
        {flights.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
      </div>
      {hasNextPage && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}

interface FlightCardProps {
  flight: Flight;
}

function FlightCard({ flight }: FlightCardProps) {
  return (
    <Link
      to={`/flight/${flight.icao24}`}
      className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">
            {flight.callsign || flight.icao24}
          </h3>
          <p className="text-sm text-gray-600">
            ICAO24: {flight.icao24}
          </p>
          <p className="text-sm text-gray-600">
            Country: {flight.originCountry}
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Last seen:</p>
          <p>
            {flight.lastSeenAt
              ? format(parseISO(flight.lastSeenAt), 'MMM d, HH:mm')
              : 'N/A'}
          </p>
        </div>
      </div>
    </Link>
  );
}
