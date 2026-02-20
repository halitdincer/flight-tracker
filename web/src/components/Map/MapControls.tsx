interface MapControlsProps {
  onPanelToggle: () => void;
  panelOpen: boolean;
}

export default function MapControls({
  onPanelToggle,
  panelOpen,
}: MapControlsProps) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-end p-3 md:p-4"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      <button
        onClick={onPanelToggle}
        className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-slate-900 shadow-lg ring-1 ring-slate-200 backdrop-blur hover:bg-white"
        title={panelOpen ? 'Close panel' : 'Open panel'}
      >
        <span className="text-base">{panelOpen ? '✕' : '☰'}</span>
      </button>
    </div>
  );
}
