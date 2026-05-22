'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '@/store/useMapStore';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon paths
const fixLeafletIcon = () => {
  (L.Icon.Default.prototype as any)._getIconUrl = undefined;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// Component to dynamically synchronize map center and zoom from store
const MapStateSynchronizer: React.FC = () => {
  const map = useMap();
  const mapCenter = useMapStore((state) => state.mapCenter);
  const zoom = useMapStore((state) => state.zoom);

  useEffect(() => {
    map.setView(mapCenter, zoom, { animate: true, duration: 1.0 });
  }, [mapCenter, zoom, map]);

  return null;
};

export const LeafletMap: React.FC = () => {
  // Distance helper for 2G bandwidth cockpit constraints
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // meters
    const d1 = (lat1 * Math.PI) / 180;
    const d2 = (lat2 * Math.PI) / 180;
    const df = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(df / 2) * Math.sin(df / 2) +
      Math.cos(d1) * Math.cos(d2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const { 
    incidents, hoveredId, setHoveredId, currentRoute, 
    mapCenter, zoom, setMapCenter, setZoom, 
    connectivityMode, voteIncident 
  } = useMapStore();

  useEffect(() => {
    fixLeafletIcon();
  }, []);

  // Custom Neon HTML Markers using L.divIcon scaled by trustScore
  const createDivIcon = (type: 'hazard' | 'safezone' | 'sos', isHovered: boolean, trustScore = 1.0) => {
    let colorClass = 'bg-safety-emerald border-emerald-400 shadow-[0_0_12px_#10b981]';
    let ringClass = 'bg-safety-emerald/30 animate-ping-slow';
    
    // Scale marker size dynamically based on community trustScore (0.1 to 3.0 range)
    const scale = Math.max(0.5, Math.min(2.5, trustScore));
    const baseSize = isHovered ? 20 : 14;
    const sizeVal = Math.round(baseSize * scale);
    const pulseSizeVal = Math.round((isHovered ? 32 : 24) * scale);
    
    let size = `width: ${sizeVal}px; height: ${sizeVal}px;`;
    let pulseSize = `width: ${pulseSizeVal}px; height: ${pulseSizeVal}px; margin-left: -${pulseSizeVal / 2}px; margin-top: -${pulseSizeVal / 2}px;`;

    if (type === 'hazard') {
      colorClass = 'bg-safety-orange border-orange-400 shadow-[0_0_12px_#f97316]';
      ringClass = 'bg-safety-orange/30 animate-ping-slow';
    } else if (type === 'sos') {
      colorClass = 'bg-safety-crimson border-red-400 shadow-[0_0_16px_#ef4444]';
      ringClass = 'bg-safety-crimson/50 animate-ping';
      size = `width: ${sizeVal * 1.2}px; height: ${sizeVal * 1.2}px;`;
    }

    return L.divIcon({
      className: 'custom-neon-marker',
      html: `
        <div class="relative flex items-center justify-center" style="transform: translate(-50%, -50%);">
          <div class="absolute ${ringClass} rounded-full" style="${pulseSize}"></div>
          <div class="${colorClass} rounded-full border-2 border-slate-900 transition-all duration-300" style="${size}"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [0, 0]
    });
  };

  // Convert Route coordinates to Leaflet lat/lng array
  const polylineCoords = currentRoute 
    ? currentRoute.coordinates.map(c => [c.lat, c.lng] as [number, number])
    : [];

  // 2G Mobile Presets filtering: limit scans to 500 meters from mapCenter
  const filteredIncidents = incidents.filter((incident) => {
    if (connectivityMode === '2g') {
      const distance = getDistance(incident.lat, incident.lng, mapCenter[0], mapCenter[1]);
      return distance <= 500; // 500m radius restrict
    }
    return true;
  });

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800/40 shadow-2xl">
      {/* Legend Map Overlay Panel */}
      <div className="absolute top-4 right-4 z-[1000] glass-panel p-3.5 rounded-xl space-y-2.5 text-xs text-slate-300 pointer-events-none">
        <h4 className="font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5 mb-1.5">
          Tactical Map Index
        </h4>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-safety-emerald inline-block shadow-[0_0_6px_#10b981]" />
          <span>Active Safe Zone / SafeHaven</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-safety-orange inline-block shadow-[0_0_6px_#f97316]" />
          <span>Elevated Alert / Dark Zone</span>
        </div>
        <div className="flex items-center gap-2 animate-pulse">
          <span className="w-3 h-3 rounded-full bg-safety-crimson inline-block shadow-[0_0_8px_#ef4444]" />
          <span>SOS Distress Beacon Activated</span>
        </div>
        {connectivityMode === '2g' && (
          <div className="border-t border-dashed border-orange-500/30 pt-2 mt-1 text-[10px] text-orange-400 flex items-center gap-1 font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
            2G Mode: 500m Geofencing Active
          </div>
        )}
      </div>

      <MapContainer
        center={mapCenter}
        zoom={zoom}
        zoomControl={false}
        className="w-full h-full"
        whenReady={(mapEvent) => {
          const map = mapEvent.target;
          map.on('moveend', () => {
            const center = map.getCenter();
            setMapCenter([center.lat, center.lng]);
          });
          map.on('zoomend', () => {
            setZoom(map.getZoom());
          });
        }}
      >
        {/* CartoDB Dark Matter tile layer for obsidian tactical style */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Sync zoom and centers */}
        <MapStateSynchronizer />

        {/* Pulsing Dash Animating Path */}
        {polylineCoords.length > 0 && (
          <>
            {/* Background glowing path */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#3b82f6',
                weight: 6,
                opacity: 0.15,
                lineCap: 'round',
              }}
            />
            {/* Foreground animated dashed path */}
            <Polyline
              positions={polylineCoords}
              eventHandlers={{
                mouseover: () => {},
              }}
              pathOptions={{
                color: '#10b981', // green for safe route
                weight: 4,
                opacity: 0.85,
                lineCap: 'round',
                className: 'animated-route-line' // styled in globals.css for dashed animation
              }}
            />
          </>
        )}

        {/* Beacons / Incidents */}
        {filteredIncidents.map((incident) => {
          const isHovered = hoveredId === incident.id;
          
          return (
            <Marker
              key={incident.id}
              position={[incident.lat, incident.lng]}
              icon={createDivIcon(incident.type, isHovered, incident.trustScore)}
              eventHandlers={{
                mouseover: () => {
                  setHoveredId(incident.id);
                },
                mouseout: () => {
                  setHoveredId(null);
                },
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-slate-200 min-w-[200px]">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-extrabold text-sm tracking-tight text-white">
                      {incident.category}
                    </h4>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                      incident.severity === 'high' 
                        ? 'bg-red-950/40 text-red-400 border-red-500/20' 
                        : incident.severity === 'medium'
                          ? 'bg-orange-950/40 text-orange-400 border-orange-500/20'
                          : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {incident.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1.5 pb-1">
                    {incident.description}
                  </p>
                  
                  {/* Peer Voting UI Controls */}
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 pb-1 mt-1 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Trust Score:</span>
                      <span className={`font-bold ${
                        (incident.trustScore || 1.0) >= 1.5 
                          ? 'text-emerald-400 glow-emerald' 
                          : (incident.trustScore || 1.0) < 0.8
                            ? 'text-red-400 glow-crimson'
                            : 'text-orange-400 glow-orange'
                      }`}>
                        {incident.trustScore !== undefined ? incident.trustScore.toFixed(1) : '1.0'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          voteIncident(incident.id, 'upvote');
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:text-emerald-400 text-slate-400 transition-colors flex items-center gap-0.5 font-bold"
                        title="Upvote Trustworthiness"
                      >
                        ▲ <span className="text-[9px]">{incident.upvotesCount || 0}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          voteIncident(incident.id, 'downvote');
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-red-500 hover:text-red-400 text-slate-400 transition-colors flex items-center gap-0.5 font-bold"
                        title="Downvote / Report Mismatch"
                      >
                        ▼ <span className="text-[9px]">{incident.downvotesCount || 0}</span>
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-[9px] text-slate-500 italic pt-1 text-right">
                    Logged: {new Date(incident.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
