interface MapControlsProps {
  onRefresh: () => void;
  onGeolocate: () => void;
  loading: boolean;
  flightCount: number;
}

export default function MapControls({
  onRefresh,
  onGeolocate,
  loading,
  flightCount,
}: MapControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2">
      <button
        onClick={onRefresh}
        disabled={loading}
        className="bg-white text-slate-900 rounded-lg shadow-lg p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh flight data"
      >
        <svg
          className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
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
        onClick={onGeolocate}
        className="bg-white text-slate-900 rounded-lg shadow-lg p-3 hover:bg-gray-100"
        title="Go to my location"
      >
        <svg
          className="w-5 h-5"
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
      <div className="bg-white text-slate-900 rounded-lg shadow-lg px-3 py-2 text-sm text-center">
        <span className="font-semibold">{flightCount.toLocaleString()}</span>
        <span className="text-gray-500 ml-1">flights</span>
      </div>
    </div>
  );
}
