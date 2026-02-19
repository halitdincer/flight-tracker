import type { FlightPosition } from '../../types/flight';
import { format, parseISO } from 'date-fns';

interface HistoryTimelineProps {
  positions: FlightPosition[];
  selectedIndex: number | null;
  onSelectPosition: (index: number) => void;
}

export default function HistoryTimeline({
  positions,
  selectedIndex,
  onSelectPosition,
}: HistoryTimelineProps) {
  if (positions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
        No position history available.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">Position History</h3>
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {positions.map((pos, index) => (
            <button
              key={pos.id}
              onClick={() => onSelectPosition(index)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedIndex === index
                  ? 'bg-blue-100 border-blue-500 border'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {format(parseISO(pos.recordedAt), 'HH:mm:ss')}
                </span>
                <span className="text-xs text-gray-500">
                  {pos.altitude ? `${Math.round(pos.altitude)}m` : 'N/A'}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {pos.latitude.toFixed(4)}, {pos.longitude.toFixed(4)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
