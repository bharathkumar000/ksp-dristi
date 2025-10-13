'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Component to dynamically pan/zoom map based on selected incident or route bounds
function MapController({ center, bounds }: { center?: [number, number]; bounds?: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, 12, { animate: true });
    }
  }, [center, map]);

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const leafletBounds = L.latLngBounds(bounds.map((b) => L.latLng(b[0], b[1])));
      map.fitBounds(leafletBounds, { padding: [50, 50], animate: true });
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
    switch (majorHead?.toLowerCase()) {
      case 'cyber crime':
        return { color: '#06b6d4', fillColor: '#0891b2' }; // Cyan
      case 'narcotics':
        return { color: '#ec4899', fillColor: '#db2777' }; // Pink
      case 'theft':
        return { color: '#f59e0b', fillColor: '#d97706' }; // Amber
      case 'assault':
        return { color: '#ef4444', fillColor: '#dc2626' }; // Red
      default:
        return { color: '#3b82f6', fillColor: '#2563eb' }; // Blue
    }
  };

  const polylineCoords = patrolRoute
    .filter((pt) => pt.latitude && pt.longitude && Number(pt.latitude) !== 0 && Number(pt.longitude) !== 0)
    .map((pt) => [Number(pt.latitude), Number(pt.longitude)] as [number, number]);

  return (
    <div className="w-full h-full relative border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        className="w-full h-full"
        zoomControl={false}
      >
        {/* Dark style tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapController center={activeIncidentId ? mapCenter : undefined} bounds={routeBounds} />

        {/* Display Incidents as Hotspots */}
        {incidents
          .filter((inc) => inc.latitude && inc.longitude)
          .map((inc) => {
            const isSelected = inc.CaseMasterID === activeIncidentId;
            const style = getMarkerStyle(inc.CrimeMajorHeadID);

            return (
              <CircleMarker
                key={inc.CaseMasterID}
                center={[inc.latitude, inc.longitude]}
                radius={isSelected ? 14 : 9}
                pathOptions={{
                  color: style.color,
                  fillColor: style.fillColor,
                  fillOpacity: 0.6,
                  weight: isSelected ? 3 : 1.5,
                  className: isSelected ? 'animate-pulse' : ''
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectIncident) onSelectIncident(inc.CaseMasterID);
                  }
                }}
              >
                <Popup className="custom-popup bg-slate-900 text-slate-100 border border-slate-700">
                  <div className="p-2 space-y-1 text-xs">
                    <div className="font-bold text-slate-100">{inc.CrimeNo}</div>
                    <div className="flex gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {inc.CrimeMajorHeadID}
                      </span>
                    </div>
                    <div className="text-slate-400 mt-1 italic">"{inc.BriefFacts}"</div>
                  </div>
                </Popup>
              </CircleMarker>
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
      <div className="absolute bottom-4 left-4 z-[1000] p-3 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg text-xs space-y-2 shadow-lg max-w-[200px]">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">Hotspot Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-500 block border border-cyan-300"></span>
          <span className="text-slate-300">Cyber Crime</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-pink-500 block border border-pink-300"></span>
          <span className="text-slate-300">Narcotics</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 block border border-amber-300"></span>
          <span className="text-slate-300">Theft</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 block border border-red-300"></span>
          <span className="text-slate-300">Assault</span>
        </div>
        {polylineCoords.length > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <span className="w-6 h-1 bg-emerald-500 block"></span>
            <span className="text-slate-300 font-semibold">Beat Patrol Route</span>
          </div>
        )}
      </div>
    </div>
  );
}
