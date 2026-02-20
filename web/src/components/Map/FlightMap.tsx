import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Icon } from 'ol/style';
import { defaults as defaultControls } from 'ol/control';
import 'ol/ol.css';
import type { LiveFlight } from '../../types/flight';
import MapControls from './MapControls';

interface FlightMapProps {
  flights: LiveFlight[];
  panelOpen: boolean;
  onPanelToggle: () => void;
  onRefresh: () => void;
  onGeolocate: () => void;
  refreshing: boolean;
  geolocateRequest: number;
  selectedFlight?: string | null;
  onFlightSelect?: (icao24: string | null) => void;
}

export default function FlightMap({
  flights,
  panelOpen,
  onPanelToggle,
  onRefresh,
  onGeolocate,
  refreshing,
  geolocateRequest,
  selectedFlight,
  onFlightSelect,
}: FlightMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSource = useRef<VectorSource>(new VectorSource());
  const [, setUserLocation] = useState<[number, number] | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const vectorLayer = new VectorLayer({
      source: vectorSource.current,
      style: (feature) => {
        const heading = feature.get('heading') || 0;
        const isSelected = feature.get('icao24') === selectedFlight;
        return new Style({
          image: new Icon({
            src: '/plane.png',
            scale: isSelected ? 0.08 : 0.05,
            rotation: (heading * Math.PI) / 180,
          }),
        });
      },
    });

    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([0, 20]),
        zoom: 3,
      }),
      controls: defaultControls({
        zoom: false,
        rotate: false,
        attribution: false,
      }),
    });

    // Click handler for flight selection
    mapInstance.current.on('click', (event) => {
      const feature = mapInstance.current?.forEachFeatureAtPixel(
        event.pixel,
        (f) => f
      );
      if (feature && onFlightSelect) {
        onFlightSelect(feature.get('icao24'));
      } else if (onFlightSelect) {
        onFlightSelect(null);
      }
    });

    // Pointer cursor on hover
    mapInstance.current.on('pointermove', (event) => {
      const hit = mapInstance.current?.forEachFeatureAtPixel(
        event.pixel,
        () => true
      );
      if (mapRef.current) {
        mapRef.current.style.cursor = hit ? 'pointer' : '';
      }
    });

    return () => {
      mapInstance.current?.setTarget(undefined);
      mapInstance.current = null;
    };
  }, []);

  // Update flights on map
  useEffect(() => {
    vectorSource.current.clear();

    const features = flights
      .filter(
        (f) => Number.isFinite(f.latitude) && Number.isFinite(f.longitude)
      )
      .map((flight) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([flight.longitude, flight.latitude])),
        });
        feature.setProperties({
          icao24: flight.icao24,
          callsign: flight.callsign,
          heading: flight.heading,
          altitude: flight.altitude,
          velocity: flight.velocity,
          originCountry: flight.originCountry,
          onGround: flight.onGround,
        });
        return feature;
      });

    vectorSource.current.addFeatures(features);
  }, [flights]);

  // Geolocation
  useEffect(() => {
    if (geolocateRequest <= 0) return;
    if (!('geolocation' in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        setUserLocation(coords);
        mapInstance.current?.getView().animate({
          center: fromLonLat(coords),
          zoom: 8,
          duration: 500,
        });
      },
      (err) => {
        console.error('Geolocation error:', err);
      }
    );
  }, [geolocateRequest]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <MapControls
        panelOpen={panelOpen}
        onPanelToggle={onPanelToggle}
        onRefresh={onRefresh}
        onGeolocate={onGeolocate}
        refreshing={refreshing}
      />

      {selectedFlight && (
        <FlightInfoPanel
          flight={flights.find((f) => f.icao24 === selectedFlight)}
          onClose={() => onFlightSelect?.(null)}
        />
      )}
    </div>
  );
}

interface FlightInfoPanelProps {
  flight?: LiveFlight;
  onClose: () => void;
}

function FlightInfoPanel({ flight, onClose }: FlightInfoPanelProps) {
  if (!flight) return null;

  return (
    <div
      className="absolute top-3 right-3 z-20 rounded-xl bg-white/95 p-4 shadow-lg ring-1 ring-slate-200 backdrop-blur min-w-56 max-w-72 md:top-4 md:right-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-base text-slate-900">
          {flight.callsign || flight.icao24}
        </h3>
        <button
          onClick={onClose}
          className="ml-2 flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-1 text-sm">
        <p><span className="text-slate-400">ICAO24:</span> <span className="text-slate-700">{flight.icao24}</span></p>
        <p><span className="text-slate-400">Country:</span> <span className="text-slate-700">{flight.originCountry}</span></p>
        <p>
          <span className="text-slate-400">Altitude:</span>{' '}
          <span className="text-slate-700">{flight.altitude ? `${Math.round(flight.altitude)}m` : 'N/A'}</span>
        </p>
        <p>
          <span className="text-slate-400">Speed:</span>{' '}
          <span className="text-slate-700">{flight.velocity ? `${Math.round(flight.velocity)} m/s` : 'N/A'}</span>
        </p>
        <p>
          <span className="text-slate-400">Heading:</span>{' '}
          <span className="text-slate-700">{flight.heading ? `${Math.round(flight.heading)}deg` : 'N/A'}</span>
        </p>
        <p>
          <span className="text-slate-400">Status:</span>{' '}
          <span className="text-slate-700">{flight.onGround ? 'On Ground' : 'Airborne'}</span>
        </p>
      </div>
    </div>
  );
}
