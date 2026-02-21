import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { Style, Icon, Stroke } from 'ol/style';
import { defaults as defaultControls } from 'ol/control';
import 'ol/ol.css';
import type { LiveFlight, FlightPosition } from '../../types/flight';
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
  trackPositions?: FlightPosition[];
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
  trackPositions = [],
}: FlightMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSource = useRef<VectorSource>(new VectorSource());
  const trackSource = useRef<VectorSource>(new VectorSource());
  const vectorLayerRef = useRef<VectorLayer | null>(null);
  const hoveredIcao = useRef<string | null>(null);
  const selectedRef = useRef<string | null | undefined>(selectedFlight);
  const onFlightSelectRef = useRef(onFlightSelect);
  const tooltipOverlay = useRef<Overlay | null>(null);
  const [, setUserLocation] = useState<[number, number] | null>(null);

  // Keep refs in sync with props and re-render vector layer when selection changes
  useEffect(() => {
    selectedRef.current = selectedFlight;
    onFlightSelectRef.current = onFlightSelect;
    vectorLayerRef.current?.changed();
  }, [selectedFlight, onFlightSelect]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const vectorLayer = new VectorLayer({
      source: vectorSource.current,
      style: (feature, resolution) => {
        const heading = feature.get('heading') || 0;
        const icao24 = feature.get('icao24');
        const callsign = feature.get('callsign') as string | null;
        const onGround = feature.get('onGround');
        const category = feature.get('category') as number | null;

        // Surface vehicles: category 14-18 (surface emergency, service, ground obstruction, etc.)
        const isSurfaceVehicle =
          category != null && category >= 14 && category <= 18;
        const isCallsignVehicle = isLikelyVehicleCallsign(callsign);
        const isGroundVehicle = onGround && (isSurfaceVehicle || isCallsignVehicle);

        // Hide ground items only when very far zoomed out (resolution < 180 ≈ zoom 10+)
        if (onGround && resolution > 180) {
          return new Style({});
        }

        const isHighlighted =
          icao24 === selectedRef.current || icao24 === hoveredIcao.current;

        let iconSrc: string;
        let scale: number;

        if (isGroundVehicle) {
          iconSrc = isHighlighted ? '/vehicle-selected.svg' : '/vehicle.svg';
          scale = 0.25;
        } else if (onGround) {
          iconSrc = isHighlighted ? '/plane-selected.svg' : '/plane-ground.svg';
          scale = 0.45;
        } else {
          iconSrc = isHighlighted ? '/plane-selected.svg' : '/plane.svg';
          scale = 0.45;
        }

        return new Style({
          image: new Icon({
            src: iconSrc,
            scale,
            rotation: (heading * Math.PI) / 180,
          }),
        });
      },
    });
    vectorLayerRef.current = vectorLayer;

    const trackLayer = new VectorLayer({
      source: trackSource.current,
      style: new Style({
        stroke: new Stroke({
          color: '#FF8A80',
          width: 2.5,
        }),
      }),
    });

    // Tooltip overlay
    const overlay = new Overlay({
      element: tooltipRef.current!,
      positioning: 'bottom-center',
      offset: [0, -12],
      stopEvent: false,
    });
    tooltipOverlay.current = overlay;

    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          className: 'ol-layer-darkened',
          source: new XYZ({
            url: 'https://{a-d}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            attributions:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          }),
        }),
        trackLayer,
        vectorLayer,
      ],
      overlays: [overlay],
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
      if (feature && onFlightSelectRef.current) {
        onFlightSelectRef.current(feature.get('icao24'));
      } else if (onFlightSelectRef.current) {
        onFlightSelectRef.current(null);
      }
    });

    // Pointer cursor + hover highlight + tooltip
    mapInstance.current.on('pointermove', (event) => {
      const feature = mapInstance.current?.forEachFeatureAtPixel(
        event.pixel,
        (f) => f
      ) as Feature | undefined;
      const newHovered = feature ? (feature.get('icao24') as string) : null;

      if (mapRef.current) {
        mapRef.current.style.cursor = newHovered ? 'pointer' : '';
      }

      if (newHovered !== hoveredIcao.current) {
        hoveredIcao.current = newHovered;
        vectorLayerRef.current?.changed();
      }

      // Tooltip
      if (feature && tooltipRef.current) {
        const callsign = feature.get('callsign') || feature.get('icao24');
        tooltipRef.current.textContent = callsign;
        tooltipRef.current.style.display = 'block';
        const geom = feature.getGeometry() as Point;
        tooltipOverlay.current?.setPosition(geom.getCoordinates());
      } else if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
        tooltipOverlay.current?.setPosition(undefined);
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
          category: flight.category,
        });
        return feature;
      });

    vectorSource.current.addFeatures(features);
  }, [flights]);

  // Update selected flight track line
  useEffect(() => {
    trackSource.current.clear();

    if (!selectedFlight || trackPositions.length < 2) return;

    const ordered = [...trackPositions]
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      .sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
      );

    if (ordered.length < 2) return;

    // Keep only the most recent track window to avoid stale jumps/teleports.
    const newestTs = new Date(ordered[ordered.length - 1].recordedAt).getTime();
    const recent = ordered.filter(
      (p) => new Date(p.recordedAt).getTime() >= newestTs - 12 * 60 * 60 * 1000
    );

    if (recent.length < 2) return;

    // Build segments and break only on impossible jumps.
    const segments: Array<Array<[number, number]>> = [];
    let currentSegment: Array<[number, number]> = [];

    for (let i = 0; i < recent.length; i += 1) {
      const point = recent[i];
      const coords: [number, number] = [point.longitude, point.latitude];

      if (i === 0) {
        currentSegment.push(coords);
        continue;
      }

      const prev = recent[i - 1];
      const distanceKm = haversineKm(
        prev.latitude,
        prev.longitude,
        point.latitude,
        point.longitude
      );
      const deltaMinutes =
        (new Date(point.recordedAt).getTime() -
          new Date(prev.recordedAt).getTime()) /
        60000;

      const speedKmh = deltaMinutes > 0 ? distanceKm / (deltaMinutes / 60) : Infinity;
      const hasImpossibleJump = distanceKm > 120 && speedKmh > 1200;

      if (hasImpossibleJump) {
        if (currentSegment.length >= 2) {
          segments.push(currentSegment);
        }
        currentSegment = [coords];
      } else {
        currentSegment.push(coords);
      }
    }

    if (currentSegment.length >= 2) {
      segments.push(currentSegment);
    }

    segments.forEach((segment) => {
      const feature = new Feature({
        geometry: new LineString(segment.map(([lon, lat]) => fromLonLat([lon, lat]))),
      });
      trackSource.current.addFeature(feature);
    });
  }, [selectedFlight, trackPositions]);

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
      {/* Tooltip element for OpenLayers Overlay */}
      <div
        ref={tooltipRef}
        className="rounded bg-black/80 px-2 py-1 text-xs font-medium text-white whitespace-nowrap pointer-events-none"
        style={{ display: 'none' }}
      />
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

function isSurfaceVehicleCategory(category: number | null): boolean {
  return category != null && category >= 14 && category <= 18;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  let dLonDeg = lon2 - lon1;
  if (dLonDeg > 180) dLonDeg -= 360;
  if (dLonDeg < -180) dLonDeg += 360;
  const dLon = toRad(dLonDeg);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isLikelyVehicleCallsign(callsign: string | null | undefined): boolean {
  if (!callsign) return false;

  const normalized = callsign.trim().toUpperCase();
  // Common airport surface vehicle prefixes
  return /^(BUS|TR|TUG|PUSH|FUEL|FOLLOW|OPS|SVC|RAMP|GSE|FIRE|RESCUE|RSC|CAR|VAN)(?:\b|\d|[-_])/.test(normalized);
}

function categoryLabel(category: number | null): string {
  if (category == null) return 'Unknown';

  const labels: Record<number, string> = {
    0: 'No Info (OpenSky)',
    1: 'Light Aircraft',
    2: 'Small Aircraft',
    3: 'Large Aircraft',
    4: 'High Vortex Aircraft',
    5: 'Heavy Aircraft',
    6: 'High Performance Aircraft',
    7: 'Rotorcraft',
    8: 'Glider',
    9: 'Lighter Than Air',
    10: 'Parachutist',
    11: 'Ultralight',
    12: 'Reserved',
    13: 'UAV',
    14: 'Surface Emergency Vehicle',
    15: 'Surface Service Vehicle',
    16: 'Point Obstacle',
    17: 'Cluster Obstacle',
    18: 'Line Obstacle'
  };

  return labels[category] || `Category ${category}`;
}

function FlightInfoPanel({ flight, onClose }: FlightInfoPanelProps) {
  if (!flight) return null;

  const isSurfaceVehicle = isSurfaceVehicleCategory(flight.category);
  const isCallsignVehicle = isLikelyVehicleCallsign(flight.callsign);
  const statusLabel = !flight.onGround
    ? 'Airborne'
    : isSurfaceVehicle || isCallsignVehicle
      ? 'Surface Vehicle'
      : 'Grounded Aircraft';

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
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="space-y-1 text-sm">
        <p>
          <span className="text-slate-400">Callsign:</span>{' '}
          <span className="text-slate-700">{flight.callsign || 'N/A'}</span>
        </p>
        <p>
          <span className="text-slate-400">ICAO24:</span>{' '}
          <span className="text-slate-700">{flight.icao24}</span>
        </p>
        <p>
          <span className="text-slate-400">Country:</span>{' '}
          <span className="text-slate-700">{flight.originCountry}</span>
        </p>
        <p>
          <span className="text-slate-400">Altitude:</span>{' '}
          <span className="text-slate-700">
            {flight.altitude != null ? `${Math.round(flight.altitude)}m` : 'N/A'}
          </span>
        </p>
        <p>
          <span className="text-slate-400">Speed:</span>{' '}
          <span className="text-slate-700">
            {flight.velocity != null ? `${Math.round(flight.velocity)} m/s` : 'N/A'}
          </span>
        </p>
        <p>
          <span className="text-slate-400">Heading:</span>{' '}
          <span className="text-slate-700">
            {flight.heading != null ? `${Math.round(flight.heading)}deg` : 'N/A'}
          </span>
        </p>
        <p>
          <span className="text-slate-400">Category:</span>{' '}
          <span className="text-slate-700">
            {categoryLabel(flight.category)}
            {flight.category != null ? ` (${flight.category})` : ''}
          </span>
        </p>
        <p>
          <span className="text-slate-400">Status:</span>{' '}
          <span className="text-slate-700">{statusLabel}</span>
        </p>
      </div>
    </div>
  );
}
