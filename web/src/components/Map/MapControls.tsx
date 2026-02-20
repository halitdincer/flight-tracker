interface MapControlsProps {
  onRefresh: () => void;
  onGeolocate: () => void;
  onPanelToggle: () => void;
  panelOpen: boolean;
  loading: boolean;
  flightCount: number;
}

export default function MapControls({
  onRefresh,
  onGeolocate,
  onPanelToggle,
  panelOpen,
  loading,
  flightCount,
}: MapControlsProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-3 md:p-4">
      <button
        onClick={onPanelToggle}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-sm font-medium text-slate-900 shadow-lg ring-1 ring-slate-200 backdrop-blur hover:bg-white"
      >
        <span className="text-base">{panelOpen ? '✕' : '☰'}</span>
        <span>{panelOpen ? 'Close panel' : 'Open panel'}</span>
      </button>

      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-slate-900 shadow-lg ring-1 ring-slate-200 backdrop-blur hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          title="Refresh flight data"
        >
          <svg
            className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
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
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-slate-900 shadow-lg ring-1 ring-slate-200 backdrop-blur hover:bg-white"
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
        <div className="rounded-xl bg-white/95 px-3 py-2 text-center text-sm text-slate-900 shadow-lg ring-1 ring-slate-200 backdrop-blur">
          <span className="font-semibold">{flightCount.toLocaleString()}</span>
          <span className="ml-1 text-slate-500">flights</span>
        </div>
      </div>
    </div>
  );
}
