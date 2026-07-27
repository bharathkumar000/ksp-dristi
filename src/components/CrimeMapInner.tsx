'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Component to dynamically pan/zoom map based on selected incident or route bounds
function MapController({ center, bounds }: { center?: [number, number]; bounds?: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size immediately to handle container resizing and tab switching transitions
    const triggerInvalidate = () => {
      if (map) {
        map.invalidateSize();
      }
    };

    triggerInvalidate();

    // Trigger multiple times over 3 seconds to catch final animation frame layout sizes
    const delays = [50, 100, 200, 300, 500, 800, 1200, 2000, 3000];
    const timers = delays.map(delay => setTimeout(triggerInvalidate, delay));

    // Handle window resize dynamically
    window.addEventListener('resize', triggerInvalidate);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', triggerInvalidate);
    };
  }, [map]);

  useEffect(() => {
    if (center) {
      map.setView(center, 12, { animate: true });
    }
  }, [center, map]);

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const leafletBounds = L.latLngBounds(bounds.map((b) => L.latLng(b[0], b[1])));
      map.fitBounds(leafletBounds, { padding: [50, 50], animate: true });
      map.invalidateSize();
    }
  }, [bounds, map]);

  return null;
}

interface CrimeMapInnerProps {
  incidents: any[];
  patrolRoute: any[];
  activeIncidentId?: string | null;
  onSelectIncident?: (id: string) => void;
}

export default function CrimeMapInner({
  incidents = [],
  patrolRoute = [],
  activeIncidentId = null,
  onSelectIncident
}: CrimeMapInnerProps) {
  const defaultCenter: [number, number] = [12.9716, 77.5946]; // Bangalore center
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [routeBounds, setRouteBounds] = useState<[number, number][]>([]);

  // Update map viewport based on active incident
  useEffect(() => {
    if (activeIncidentId) {
      const activeInc = incidents.find((inc) => inc.CaseMasterID === activeIncidentId);
      if (activeInc && activeInc.latitude && activeInc.longitude) {
        setMapCenter([activeInc.latitude, activeInc.longitude]);
      }
    }
  }, [activeIncidentId, incidents]);

  // Update bounds based on patrol route
  useEffect(() => {
    if (patrolRoute && patrolRoute.length > 0) {
      const coords = patrolRoute
        .filter((p) => p.latitude && p.longitude && Number(p.latitude) !== 0 && Number(p.longitude) !== 0)
        .map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number]);
      setRouteBounds(coords);
    } else if (incidents && incidents.length > 0) {
      // Otherwise adjust bounds to fit all incidents
      const coords = incidents
        .filter((inc) => inc.latitude && inc.longitude && Number(inc.latitude) !== 0 && Number(inc.longitude) !== 0)
        .map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number]);
      if (coords.length > 0) {
        setRouteBounds(coords);
      }
    }
  }, [patrolRoute, incidents]);

  // Crime Head styling selector
  const getMarkerStyle = (majorHead: string) => {
    const headLower = majorHead?.toLowerCase() || '';
    if (headLower.includes('cyber') || headLower.includes('fraud') || headLower.includes('cen')) {
      return { color: '#06b6d4', fillColor: '#0891b2' }; // Cyan
    } else if (headLower.includes('ndps') || headLower.includes('narcotics') || headLower.includes('drug')) {
      return { color: '#ec4899', fillColor: '#db2777' }; // Pink
    } else if (headLower.includes('theft') || headLower.includes('burglary') || headLower.includes('robbery') || headLower.includes('stolen')) {
      return { color: '#f59e0b', fillColor: '#d97706' }; // Amber
    } else if (headLower.includes('assault') || headLower.includes('hurt') || headLower.includes('kidnap') || headLower.includes('abduction')) {
      return { color: '#ef4444', fillColor: '#dc2626' }; // Red
    } else {
      return { color: '#3b82f6', fillColor: '#2563eb' }; // Blue
    }
  };

  // Custom marker creator with animated pulsing ring and glowing center
  const getCustomIcon = (majorHead: string, isSelected: boolean) => {
    const style = getMarkerStyle(majorHead);
    const size = isSelected ? 24 : 16;
    const pulseSize = isSelected ? 'w-8 h-8 -mt-2 -ml-2' : 'w-6 h-6 -mt-1 -ml-1';
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex items-center justify-center" style="width: ${size}px; height: ${size}px;">
          <!-- Pulsing ripple outer ring -->
          <div class="absolute rounded-full animate-ping opacity-60 ${pulseSize}" style="background-color: ${style.color};"></div>
          <!-- Solid core with glowing shadow and white border -->
          <div class="absolute rounded-full w-full h-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-300 ${isSelected ? 'scale-125' : ''}" style="background-color: ${style.color}; box-shadow: 0 0 10px ${style.color};">
            <!-- Center white dot -->
            <div class="rounded-full bg-white w-1.5 h-1.5"></div>
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  const polylineCoords = patrolRoute
    .filter((pt) => pt.latitude && pt.longitude && Number(pt.latitude) !== 0 && Number(pt.longitude) !== 0)
    .map((pt) => [Number(pt.latitude), Number(pt.longitude)] as [number, number]);

  return (
    <div className="w-full h-full relative border border-slate-200 rounded-xl overflow-hidden shadow-md">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        className="w-full h-full"
        zoomControl={false}
      >
        {/* Light style tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapController center={activeIncidentId ? mapCenter : undefined} bounds={routeBounds} />

        {/* Display Incidents as Hotspots */}
        {incidents
          .filter((inc) => inc.latitude && inc.longitude)
          .map((inc) => {
            const isSelected = inc.CaseMasterID === activeIncidentId;
            const style = getMarkerStyle(inc.CrimeMajorHeadID);

            return (
              <Marker
                key={inc.CaseMasterID}
                position={[inc.latitude, inc.longitude]}
                icon={getCustomIcon(inc.CrimeMajorHeadID, isSelected)}
                eventHandlers={{
                  click: () => {
                    if (onSelectIncident) onSelectIncident(inc.CaseMasterID);
                  }
                }}
              >
                <Popup className="custom-popup bg-white text-slate-800 border border-slate-200">
                  <div className="p-2 space-y-1 text-xs">
                    <div className="font-bold text-slate-800">{inc.CrimeNo}</div>
                    <div className="flex gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {inc.CrimeMajorHeadID}
                      </span>
                    </div>
                    <div className="text-slate-500 mt-1 italic">"{inc.BriefFacts}"</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Render Predictive Patrol Route Polyline */}
        {polylineCoords.length > 0 && (
          <>
            {/* Outline/Glow effect */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#10b981', // Emerald
                weight: 6,
                opacity: 0.3,
                dashArray: '10, 10'
              }}
            />
            {/* Solid line */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#10b981',
                weight: 3,
                opacity: 0.95
              }}
            />
            {/* Render Waypoint Markers */}
            {patrolRoute.map((pt, index) => (
              <CircleMarker
                key={`wp-${index}`}
                center={[pt.latitude, pt.longitude]}
                radius={5}
                pathOptions={{
                  color: '#10b981',
                  fillColor: '#ffffff',
                  fillOpacity: 1,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <div className="font-bold">Patrol Waypoint #{index + 1}</div>
                    <div className="text-slate-500">Beat: {pt.Beat_Name || 'Patrol Spot'}</div>
                    <div className="text-slate-400">Lat: {pt.latitude.toFixed(4)}, Lng: {pt.longitude.toFixed(4)}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </>
        )}
      </MapContainer>

      {/* Map Legends HUD overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] p-3 bg-white/95 backdrop-blur border border-slate-200 rounded-lg text-xs space-y-2 shadow-md max-w-[200px] text-slate-700">
        <div className="font-bold text-slate-800 border-b border-slate-100 pb-1">Hotspot Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-500 block border border-cyan-300"></span>
          <span className="text-slate-600">Cyber Crime</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-pink-500 block border border-pink-300"></span>
          <span className="text-slate-600">Narcotics</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 block border border-amber-300"></span>
          <span className="text-slate-600">Theft</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 block border border-red-300"></span>
          <span className="text-slate-600">Assault</span>
        </div>
        {polylineCoords.length > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <span className="w-6 h-1 bg-emerald-500 block"></span>
            <span className="text-slate-600 font-semibold">Beat Patrol Route</span>
          </div>
        )}
      </div>
    </div>
  );
}
