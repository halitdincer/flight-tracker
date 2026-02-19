import { useState, useEffect } from 'react';
import type { FlightPosition } from '../../types/flight';

interface TrackPlaybackProps {
  positions: FlightPosition[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export default function TrackPlayback({
  positions,
  currentIndex,
  onIndexChange,
  isPlaying,
  onPlayPause,
}: TrackPlaybackProps) {
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!isPlaying || positions.length === 0) return;

    const interval = setInterval(() => {
      onIndexChange((currentIndex + 1) % positions.length);
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, positions.length, speed, onIndexChange]);

  if (positions.length === 0) return null;

  const progress = positions.length > 1 
    ? (currentIndex / (positions.length - 1)) * 100 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onPlayPause}
          className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={positions.length - 1}
            value={currentIndex}
            onChange={(e) => onIndexChange(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Position {currentIndex + 1} of {positions.length}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
        </div>

        <select
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={5}>5x</option>
        </select>
      </div>
    </div>
  );
}
