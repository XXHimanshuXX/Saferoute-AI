'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore, Incident, RouteData } from '@/store/useMapStore';
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
  // Distance helper in meters
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
    connectivityMode, voteIncident,
    userLocation, setUserLocation,
    startCoords, setStartCoords,
    destCoords, setDestCoords,
    setCurrentRoute
  } = useMapStore();

  useEffect(() => {
    fixLeafletIcon();
  }, []);

  // HTML5 Browser Geolocation API Setup
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    
    console.log('📡 Starting real-time HTML5 Geolocation watch...');
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`📍 Live coordinate telemetry updated: [${latitude}, ${longitude}]`);
        setUserLocation([latitude, longitude]);
      },
      (error) => {
        console.warn('⚠️ Geolocation access denied or unavailable:', error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [setUserLocation]);

  const recenterOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      setZoom(16);
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setZoom(16);
        },
        (err) => alert('Geolocation access not authorized. Please check your browser permission settings.')
      );
    }
  };

  // Click-to-Route triggers
  const calculateCoordinatesRoute = async (start: [number, number], end: [number, number]) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    console.log(`🚀 Planning path between click points: Start [${start}], End [${end}]`);

    try {
      const res = await fetch(`${apiBase}/api/routes/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: {
            address: `Click Start [${start[0].toFixed(4)}, ${start[1].toFixed(4)}]`,
            coordinates: [start[1], start[0]] // [lng, lat]
          },
          end: {
            address: `Click Destination [${end[0].toFixed(4)}, ${end[1].toFixed(4)}]`,
            coordinates: [end[1], end[0]] // [lng, lat]
          },
          routeType: 'safest'
        })
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        const routesList = data.routes || [];
        const recommendedRoute = data.recommended || routesList[0];
        
        const routeData: RouteData = {
          coordinates: recommendedRoute?.coordinates || [
            { lat: start[0], lng: start[1] },
            { lat: (start[0] + end[0]) / 2, lng: (start[1] + end[1]) / 2 },
            { lat: end[0], lng: end[1] }
          ],
          segments: recommendedRoute?.segments || [
            { color: 'emerald', startIndex: 0, endIndex: 2 }
          ],
          duration: recommendedRoute?.routeData?.estimatedTime || 15,
          distance: recommendedRoute?.routeData?.totalDistance || (getDistance(start[0], start[1], end[0], end[1]) / 1000),
          safetyScore: Math.round(recommendedRoute?.routeData?.safetyScore || 90)
        };
        setCurrentRoute(routeData);
      } else {
        // Fallback procedural route between the two tapped points
        const distKm = getDistance(start[0], start[1], end[0], end[1]) / 1000;
        const routeData: RouteData = {
          coordinates: [
            { lat: start[0], lng: start[1] },
            { lat: start[0] + (end[0] - start[0]) * 0.3 + 0.0005, lng: start[1] + (end[1] - start[1]) * 0.3 - 0.0005 },
            { lat: start[0] + (end[0] - start[0]) * 0.7 - 0.0005, lng: start[1] + (end[1] - start[1]) * 0.7 + 0.0005 },
            { lat: end[0], lng: end[1] }
          ],
          segments: [
            { color: 'emerald', startIndex: 0, endIndex: 1 },
            { color: 'orange', startIndex: 1, endIndex: 2 },
            { color: 'emerald', startIndex: 2, endIndex: 3 }
          ],
          duration: Math.max(1, Math.round(distKm * 6)),
          distance: Math.round(distKm * 10) / 10,
          safetyScore: 92
        };
        setCurrentRoute(routeData);
      }
    } catch (err) {
      console.error('Map click route calculation error:', err);
    }
  };

  // Component to register Leaflet click handlers
  const MapEventsHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        const currentStart = useMapStore.getState().startCoords;
        const currentDest = useMapStore.getState().destCoords;
        
        if (!currentStart) {
          setStartCoords([lat, lng]);
        } else if (!currentDest) {
          setDestCoords([lat, lng]);
          await calculateCoordinatesRoute(currentStart, [lat, lng]);
        } else {
          setStartCoords([lat, lng]);
          setDestCoords(null);
          setCurrentRoute(null);
        }
      }
    });
    return null;
  };

  // Custom Neon HTML Markers using L.divIcon scaled by trustScore
  const createDivIcon = (type: 'hazard' | 'safezone' | 'sos' | 'user_location', isHovered: boolean, trustScore = 1.0) => {
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
    } else if (type === 'user_location') {
      colorClass = 'bg-blue-500 border-blue-400 shadow-[0_0_15px_#3b82f6]';
      ringClass = 'bg-blue-500/30 animate-ping';
      size = `width: 14px; height: 14px;`;
      pulseSize = `width: 28px; height: 28px; margin-left: -14px; margin-top: -14px;`;
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
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-[0_0_8px_#3b82f6]" />
          <span>You Are Here (Live Location)</span>
        </div>
        {connectivityMode === '2g' && (
          <div className="border-t border-dashed border-orange-500/30 pt-2 mt-1 text-[10px] text-orange-400 flex items-center gap-1 font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
            2G Mode: 500m Geofencing Active
          </div>
        )}
      </div>

      {/* GPS Recenter Action controls overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] flex gap-2">
        <button
          onClick={recenterOnUser}
          className="p-3 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all duration-200 active:scale-95 shadow-lg flex items-center justify-center gap-1.5 font-bold uppercase text-[10px] tracking-wider"
          title="Tactical Recenter on Live Location"
        >
          <span>🎯</span>
          Recenter GPS
        </button>

        {(startCoords || destCoords) && (
          <button
            onClick={() => {
              setStartCoords(null);
              setDestCoords(null);
              setCurrentRoute(null);
            }}
            className="p-3 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition-all duration-200 active:scale-95 shadow-lg flex items-center justify-center gap-1.5 font-bold uppercase text-[10px] tracking-wider"
            title="Clear Pinned Locations"
          >
            <span>🗑️</span>
            Clear Pins
          </button>
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
            const currentCenter = useMapStore.getState().mapCenter;
            const latDiff = Math.abs(center.lat - currentCenter[0]);
            const lngDiff = Math.abs(center.lng - currentCenter[1]);
            
            // Precision threshold check to avoid recursive pan loop (approx 11m grid resolution)
            if (latDiff > 0.0001 || lngDiff > 0.0001) {
              setMapCenter([center.lat, center.lng]);
            }
          });
          map.on('zoomend', () => {
            const newZoom = map.getZoom();
            const currentZoom = useMapStore.getState().zoom;
            if (newZoom !== currentZoom) {
              setZoom(newZoom);
            }
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

        {/* Dynamic Clicks Event Handler */}
        <MapEventsHandler />

        {/* Live User GPS Marker */}
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={createDivIcon('user_location', true)}
          >
            <Popup>
              <div className="text-center font-bold text-xs uppercase p-1 text-slate-200">
                You Are Here
                <div className="text-[9px] text-slate-400 font-medium normal-case pt-0.5">
                  Lat: {userLocation[0].toFixed(5)}, Lng: {userLocation[1].toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Start Click coordinate pin */}
        {startCoords && (
          <Marker 
            position={startCoords}
            icon={L.divIcon({
              className: 'custom-neon-marker',
              html: `
                <div class="relative flex items-center justify-center" style="transform: translate(-50%, -50%);">
                  <div class="absolute bg-emerald-500/35 animate-ping-slow rounded-full" style="width: 24px; height: 24px; margin-left: -12px; margin-top: -12px;"></div>
                  <div class="bg-emerald-500 border-2 border-slate-900 rounded-full shadow-[0_0_12px_#10b981]" style="width: 16px; height: 16px;"></div>
                  <div class="absolute -top-7 text-[9px] font-black uppercase text-emerald-400 bg-slate-950/90 px-1.5 py-0.5 border border-emerald-500/35 rounded whitespace-nowrap shadow-md">START</div>
                </div>
              `,
              iconSize: [24, 24]
            })}
          />
        )}

        {/* Destination Click coordinate pin */}
        {destCoords && (
          <Marker 
            position={destCoords}
            icon={L.divIcon({
              className: 'custom-neon-marker',
              html: `
                <div class="relative flex items-center justify-center" style="transform: translate(-50%, -50%);">
                  <div class="absolute bg-orange-500/35 animate-ping-slow rounded-full" style="width: 24px; height: 24px; margin-left: -12px; margin-top: -12px;"></div>
                  <div class="bg-orange-500 border-2 border-slate-900 rounded-full shadow-[0_0_12px_#f97316]" style="width: 16px; height: 16px;"></div>
                  <div class="absolute -top-7 text-[9px] font-black uppercase text-orange-400 bg-slate-950/90 px-1.5 py-0.5 border border-orange-500/35 rounded whitespace-nowrap shadow-md">DEST</div>
                </div>
              `,
              iconSize: [24, 24]
            })}
          />
        )}

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
              pathOptions={{
                color: currentRoute?.segments[0]?.color === 'crimson' ? '#ef4444' : currentRoute?.segments[0]?.color === 'orange' ? '#f97316' : '#10b981', 
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
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Trust:</span>
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
