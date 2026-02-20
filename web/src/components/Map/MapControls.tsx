import { useNavigate } from 'react-router-dom';

interface MapControlsProps {
  panelOpen: boolean;
  onPanelToggle: () => void;
  onRefresh: () => void;
  onGeolocate: () => void;
  refreshing: boolean;
}


const btnClass =
  'pointer-events-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-lg ring-1 ring-slate-200 backdrop-blur hover:bg-white active:scale-95 transition-transform';

export default function MapControls({
  panelOpen,
  onPanelToggle,
  onRefresh,
  onGeolocate,
  refreshing,
}: MapControlsProps) {
  const navigate = useNavigate();

  return (
    <div
      className="pointer-events-none absolute bottom-0 right-0 z-20 flex flex-col items-end gap-2 p-3 md:p-4"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
      }}
    >
      {/* Action buttons — slide up when open */}
      <div
        className={`flex flex-col gap-2 transition-all duration-200 ${
          panelOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={btnClass}
          title="Refresh flights"
        >
          <svg
            className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}
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

        {/* My location */}
        <button onClick={onGeolocate} className={btnClass} title="My location">
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

        {/* Analytics / Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className={btnClass}
          title="Dashboard"
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
              d="M3 3v18h18M9 17V9m4 8v-4m4 4V5"
            />
          </svg>
        </button>

        {/* Advanced search */}
        <button
          onClick={() => navigate('/search')}
          className={btnClass}
          title="Advanced search"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>

      {/* Hamburger toggle — always visible */}
      <button
        onClick={onPanelToggle}
        className={btnClass}
        title={panelOpen ? 'Close controls' : 'Open controls'}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {panelOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>
    </div>
  );
}
