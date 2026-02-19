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
import { FullScreen, defaults as defaultControls } from 'ol/control';
import 'ol/ol.css';
import { LiveFlight } from '../../types/flight';
import MapControls from './MapControls';

interface FlightMapProps {
  flights: LiveFlight[];
  onRefresh: () => void;
  loading: boolean;
  selectedFlight?: string | null;
  onFlightSelect?: (icao24: string | null) => void;
}

export default function FlightMap({ 
  flights, 
  onRefresh, 
  loading,
  selectedFlight,
  onFlightSelect 
}: FlightMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSource = useRef<VectorSource>(new VectorSource());
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

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
      controls: defaultControls().extend([new FullScreen()]),
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
      .filter((f) => f.latitude && f.longitude)
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

  // Center on user location
  const handleGeolocate = () => {
    if ('geolocation' in navigator) {
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
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <MapControls
        onRefresh={onRefresh}
        onGeolocate={handleGeolocate}
        loading={loading}
        flightCount={flights.length}
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
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 min-w-64">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg">
          {flight.callsign || flight.icao24}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1 text-sm">
        <p><span className="text-gray-500">ICAO24:</span> {flight.icao24}</p>
        <p><span className="text-gray-500">Country:</span> {flight.originCountry}</p>
        <p>
          <span className="text-gray-500">Altitude:</span>{' '}
          {flight.altitude ? `${Math.round(flight.altitude)}m` : 'N/A'}
        </p>
        <p>
          <span className="text-gray-500">Speed:</span>{' '}
          {flight.velocity ? `${Math.round(flight.velocity)} m/s` : 'N/A'}
        </p>
        <p>
          <span className="text-gray-500">Heading:</span>{' '}
          {flight.heading ? `${Math.round(flight.heading)}°` : 'N/A'}
        </p>
        <p>
          <span className="text-gray-500">Status:</span>{' '}
          {flight.onGround ? 'On Ground' : 'Airborne'}
        </p>
      </div>
    </div>
  );
}
