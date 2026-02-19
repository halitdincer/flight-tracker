import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { fromLonLat } from 'ol/proj';
import { Style, Icon, Stroke } from 'ol/style';
import { format, parseISO } from 'date-fns';
import 'ol/ol.css';

import { useFlight } from '../hooks/useFlights';
import { HistoryTimeline, TrackPlayback } from '../components/FlightHistory';

export default function FlightDetailPage() {
  const { icao24 } = useParams<{ icao24: string }>();
  const { flight, loading, error } = useFlight(icao24 || '');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const planeSource = useRef<VectorSource>(new VectorSource());
  const trackSource = useRef<VectorSource>(new VectorSource());

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const trackLayer = new VectorLayer({
      source: trackSource.current,
      style: new Style({
        stroke: new Stroke({
          color: '#3b82f6',
          width: 2,
        }),
      }),
    });

    const planeLayer = new VectorLayer({
      source: planeSource.current,
      style: (feature) => {
        const heading = feature.get('heading') || 0;
        return new Style({
          image: new Icon({
            src: '/plane.png',
            scale: 0.06,
            rotation: (heading * Math.PI) / 180,
          }),
        });
      },
    });

    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        trackLayer,
        planeLayer,
      ],
      view: new View({
        center: fromLonLat([0, 20]),
        zoom: 4,
      }),
    });

    return () => {
      mapInstance.current?.setTarget(undefined);
      mapInstance.current = null;
    };
  }, []);

  // Draw track and position
  useEffect(() => {
    if (!flight?.positions?.length) return;

    // Draw track line
    const coords = flight.positions.map((p) =>
      fromLonLat([p.longitude, p.latitude])
    );
    trackSource.current.clear();
    if (coords.length > 1) {
      const trackFeature = new Feature({
        geometry: new LineString(coords),
      });
      trackSource.current.addFeature(trackFeature);
    }

    // Fit view to track
    if (coords.length > 0) {
      const extent = trackSource.current.getExtent();
      mapInstance.current?.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        maxZoom: 10,
      });
    }
  }, [flight?.positions]);

  // Update plane position
  useEffect(() => {
    if (!flight?.positions?.length) return;

    const idx = selectedIndex ?? flight.positions.length - 1;
    const position = flight.positions[idx];

    planeSource.current.clear();
    const feature = new Feature({
      geometry: new Point(fromLonLat([position.longitude, position.latitude])),
    });
    feature.set('heading', position.heading);
    planeSource.current.addFeature(feature);

    // Center on current position
    mapInstance.current?.getView().animate({
      center: fromLonLat([position.longitude, position.latitude]),
      duration: 300,
    });
  }, [selectedIndex, flight?.positions]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Flight Not Found</h2>
          <p className="text-red-600 mb-4">
            Could not find flight with ICAO24: {icao24}
          </p>
          <Link to="/search" className="text-blue-600 hover:underline">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/search" className="text-gray-500 hover:text-gray-700">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">
          {flight.callsign || flight.icao24}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flight Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Flight Information</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">ICAO24</dt>
                <dd className="font-mono">{flight.icao24}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Callsign</dt>
                <dd>{flight.callsign || 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Country</dt>
                <dd>{flight.originCountry}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">First Seen</dt>
                <dd>
                  {flight.firstSeenAt
                    ? format(parseISO(flight.firstSeenAt), 'MMM d, HH:mm')
                    : 'N/A'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Last Seen</dt>
                <dd>
                  {flight.lastSeenAt
                    ? format(parseISO(flight.lastSeenAt), 'MMM d, HH:mm')
                    : 'N/A'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Positions</dt>
                <dd>{flight.positions?.length || 0}</dd>
              </div>
            </dl>
          </div>

          <TrackPlayback
            positions={flight.positions || []}
            currentIndex={selectedIndex ?? (flight.positions?.length || 1) - 1}
            onIndexChange={setSelectedIndex}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
          />

          <HistoryTimeline
            positions={flight.positions || []}
            selectedIndex={selectedIndex}
            onSelectPosition={setSelectedIndex}
          />
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div ref={mapRef} className="h-[600px] rounded-lg shadow overflow-hidden" />
        </div>
      </div>
    </div>
  );
}
