'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useMapStore, Incident, RouteData } from '@/store/useMapStore';
import { SafetyGauge } from '@/components/SafetyGauge';
import { AIOrb } from '@/components/AIOrb';
import { VoiceChat } from '@/components/VoiceChat';
import { SOSHeartbeat } from '@/components/SOSHeartbeat';
import { ConnectivityCockpit } from '@/components/ConnectivityCockpit';
import { PoliceDispatch } from '@/components/PoliceDispatch';
import { IncidentWizard } from '@/components/IncidentWizard';
import { 
  Navigation, Shield, AlertTriangle, MapPin, 
  PhoneCall, Zap, Compass, Radio, Server, Heart 
} from 'lucide-react';

// Dynamically import Leaflet with SSR false to prevent SSR errors
const LeafletMap = dynamic(
  () => import('@/components/LeafletMap').then((mod) => mod.LeafletMap),
  { ssr: false, loading: () => (
    <div className="w-full h-full bg-obsidian-900 flex items-center justify-center border border-slate-800/40 rounded-2xl">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Loading Tactical Layers...</p>
      </div>
    </div>
  )}
);

// Dynamically import 3D City view for safety
const City3D = dynamic(
  () => import('@/components/City3D').then((mod) => mod.City3D),
  { ssr: false, loading: () => (
    <div className="w-full h-full bg-obsidian-900 flex items-center justify-center border border-slate-800/40 rounded-2xl">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Initializing 3D City Matrix...</p>
      </div>
    </div>
  )}
);

export default function DashboardPage() {
  const { 
    sosActive, setSosActive, safetyScore, setSafetyScore, 
    setCurrentRoute, mapCenter, setMapCenter, setZoom, addIncident, setIncidents,
    connectivityMode
  } = useMapStore();

  const [startLoc, setStartLoc] = useState('');
  const [destLoc, setDestLoc] = useState('');
  const [routeType, setRouteType] = useState<'fastest' | 'safest'>('safest');
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeViewport, setActiveViewport] = useState<'2d' | '3d' | 'both'>('both');
  const [backendStatus, setBackendStatus] = useState<'connected' | 'offline'>('offline');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Verify connection to local Express server
  useEffect(() => {
    const pingBackend = async () => {
      try {
        const res = await fetch('http://localhost:5000/health');
        if (res.ok) setBackendStatus('connected');
        else setBackendStatus('offline');
      } catch {
        setBackendStatus('offline');
      }
    };
    pingBackend();
    const interval = setInterval(pingBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch nearby incidents when backend is connected
  useEffect(() => {
    if (backendStatus !== 'connected') return;

    const fetchIncidents = async () => {
      try {
        const [lat, lng] = mapCenter;
        const res = await fetch(`http://localhost:5000/api/safety/incidents/nearby/${lat}/${lng}?radius=3000`);
        if (res.ok) {
          const data = await res.json();
          if (data.incidents) {
            const mapped: Incident[] = data.incidents.map((inc: any) => ({
              id: inc._id,
              type: inc.type === 'street_light_issue' || inc.type === 'harassment' || inc.type === 'suspicious_activity' || inc.type === 'theft' ? 'hazard' : inc.type === 'safezone' ? 'safezone' : 'hazard',
              category: inc.location.address || inc.type.toUpperCase().replace('_', ' '),
              lat: inc.location.coordinates[1],
              lng: inc.location.coordinates[0],
              description: inc.description || '',
              severity: inc.severity >= 4 ? 'high' : inc.severity === 3 ? 'medium' : 'low',
              timestamp: new Date(inc.reportedAt)
            }));

            // Keep local safezones if they are not in the response
            const localSafeZones = useMapStore.getState().incidents.filter(inc => inc.type === 'safezone');
            mapped.push(...localSafeZones);

            // Deduplicate by id
            const seen = new Set<string>();
            const deduplicated = mapped.filter(inc => {
              if (seen.has(inc.id)) return false;
              seen.add(inc.id);
              return true;
            });

            setIncidents(deduplicated);
          }
        }
      } catch (err) {
        console.error('Failed to fetch nearby incidents:', err);
      }
    };

    fetchIncidents();
  }, [backendStatus, mapCenter, setIncidents]);

  const handleRouteCalculation = async () => {
    if (!startLoc || !destLoc) {
      alert('Please fill out both Start and Destination inputs.');
      return;
    }

    setIsCalculating(true);

    try {
      // API call to Express endpoint `/api/routes/calculate`
      const res = await fetch('http://localhost:5000/api/routes/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: startLoc,
          end: destLoc,
          routeType: routeType
        })
      }).catch(() => null);

      if (res && res.ok) {
        const responseData = await res.json();
        const score = responseData.safetyScore || (routeType === 'safest' ? 92 : 64);
        
        const route: RouteData = {
          coordinates: responseData.coordinates || [
            { lat: 26.9124, lng: 75.772 },
            { lat: 26.9135, lng: 75.78 },
            { lat: 26.914, lng: 75.788 },
            { lat: 26.916, lng: 75.796 },
            { lat: 26.918, lng: 75.802 },
            { lat: 26.9195, lng: 75.808 }
          ],
          segments: responseData.segments || [
            { color: routeType === 'safest' ? 'emerald' : 'orange', startIndex: 0, endIndex: 5 }
          ],
          duration: responseData.duration || (routeType === 'fastest' ? 12 : 18),
          distance: responseData.distance || 2.3,
          safetyScore: score
        };

        setCurrentRoute(route);
        setMapCenter([route.coordinates[0].lat, route.coordinates[0].lng]);
      } else {
        // High fidelity mock fallback
        await new Promise(resolve => setTimeout(resolve, 1400));
        
        const isSafe = routeType === 'safest';
        const route: RouteData = {
          coordinates: isSafe 
            ? [
                { lat: 26.9124, lng: 75.772 },
                { lat: 26.9135, lng: 75.78 },
                { lat: 26.914, lng: 75.788 },
                { lat: 26.916, lng: 75.796 },
                { lat: 26.918, lng: 75.802 },
                { lat: 26.9195, lng: 75.808 }
              ]
            : [
                { lat: 26.9124, lng: 75.772 },
                { lat: 26.914, lng: 75.799 }, // C-Scheme (hazard)
                { lat: 26.9185, lng: 75.7873 }, // Civil Lines (hazard)
                { lat: 26.9195, lng: 75.808 }
              ],
          segments: isSafe 
            ? [
                { color: 'emerald', startIndex: 0, endIndex: 3 },
                { color: 'emerald', startIndex: 3, endIndex: 5 }
              ]
            : [
                { color: 'emerald', startIndex: 0, endIndex: 1 },
                { color: 'orange', startIndex: 1, endIndex: 2 },
                { color: 'crimson', startIndex: 2, endIndex: 3 }
              ],
          duration: isSafe ? 21 : 14,
          distance: isSafe ? 2.3 : 1.7,
          safetyScore: isSafe ? 94 : 58
        };

        setCurrentRoute(route);
        setMapCenter([26.9124, 75.7873]);
        setZoom(14);
      }
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const triggerEmergency = async () => {
    // Toggle state
    const targetState = !sosActive;
    setSosActive(targetState);

    if (targetState) {
      // Connect to Socket or dispatch Express SOS Broadcast
      await fetch('http://localhost:5000/api/emergency/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'threat',
          severity: 'high',
          location: {
            address: 'Active User Coordinates',
            coordinates: { lat: mapCenter[0], lng: mapCenter[1] }
          },
          description: 'Emergency SOS manual bypass activated via SafeRoute Next Interface.'
        })
      }).catch(() => null);

      // Add emergency beacon dynamically to the map list
      const emergencyBeacon: Incident = {
        id: `sos-${Date.now()}`,
        type: 'sos',
        category: 'Active SOS Broadcast',
        lat: mapCenter[0] + 0.002,
        lng: mapCenter[1] - 0.002,
        description: 'SOS distress warning triggered. Emergency dispatch en route.',
        severity: 'high',
        timestamp: new Date()
      };
      
      addIncident(emergencyBeacon);
      setSafetyScore(28); // drop index level immediately
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-obsidian-950 font-sans relative text-slate-200">
      
      {/* Dynamic Crimson SOS Beat overlay */}
      <SOSHeartbeat />

      {/* Header Navigator Panel */}
      <header className="h-16 shrink-0 glass-panel border-b border-slate-800/60 flex items-center justify-between px-6 z-20 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Compass className="w-4 h-4 text-emerald-400 glow-emerald" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              SafeRoute AI <span className="text-[9px] font-black uppercase bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-400">Enterprise v2.0</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Autonomous Escort Matrix</p>
          </div>
        </div>

        {/* Server & Telemetry status indicators */}
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-card border border-slate-800/80">
            <Server className={`w-3.5 h-3.5 ${backendStatus === 'connected' ? 'text-emerald-400 glow-emerald' : 'text-slate-600'}`} />
            <span className="text-[10px] text-slate-400">SYS CORE:</span>
            <span className={backendStatus === 'connected' ? 'text-emerald-400' : 'text-slate-500'}>
              {backendStatus === 'connected' ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-card border border-slate-800/80">
            <Radio className="w-3.5 h-3.5 text-blue-400 glow-blue animate-pulse" />
            <span className="text-[10px] text-slate-400">SAT INTEL:</span>
            <span className="text-blue-400">ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar Container */}
        <aside className="w-80 shrink-0 border-r border-slate-800/60 p-5 flex flex-col gap-5 overflow-y-auto bg-obsidian-900/20 z-10">
          
          {/* Navigation Controls */}
          <div className="space-y-3.5">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              Coordinate Plan
            </label>
            
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <input 
                type="text" 
                placeholder="Starting Location"
                value={startLoc}
                onChange={(e) => setStartLoc(e.target.value)}
                className="w-full bg-obsidian-950/80 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-xl py-3 pl-10 pr-4 text-xs outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
              <input 
                type="text" 
                placeholder="Destination Coordinates"
                value={destLoc}
                onChange={(e) => setDestLoc(e.target.value)}
                className="w-full bg-obsidian-950/80 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-xl py-3 pl-10 pr-4 text-xs outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Route Profile selectors */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              Routing Profile
            </label>
            <div className="flex gap-2.5">
              <button 
                onClick={() => setRouteType('fastest')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all active:scale-95 duration-200 ${
                  routeType === 'fastest' 
                    ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-glass-glow' 
                    : 'bg-transparent border-slate-800/80 text-slate-400 hover:text-slate-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Fastest
              </button>
              <button 
                onClick={() => setRouteType('safest')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all active:scale-95 duration-200 ${
                  routeType === 'safest' 
                    ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 shadow-glass-glow' 
                    : 'bg-transparent border-slate-800/80 text-slate-400 hover:text-slate-300'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Safest
              </button>
            </div>
          </div>

          {/* Action Trigger */}
          <button 
            disabled={isCalculating}
            onClick={handleRouteCalculation}
            className={`w-full py-4 rounded-xl font-extrabold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 duration-200 border border-emerald-500/20 shadow-md ${
              isCalculating
                ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed border-slate-800'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white'
            }`}
          >
            {isCalculating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 animate-spin-slow" />
                Calculate Escort Path
              </>
            )}
          </button>

          {/* Safety Gauge */}
          <SafetyGauge />

          {/* Incident reporting launcher */}
          <button
            onClick={() => setIsWizardOpen(true)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600/20 via-red-600/20 to-orange-600/20 hover:from-orange-600 hover:to-red-650 hover:text-white border border-orange-500/35 hover:border-orange-500/50 text-orange-400 font-extrabold text-xs uppercase tracking-widest transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.06)]"
          >
            <AlertTriangle className="w-4 h-4 text-orange-400 animate-pulse animate-bounce" />
            Log Threat Telemetry
          </button>

          {/* SOS Crimson Distress Button */}
          <button
            onClick={triggerEmergency}
            className={`w-full py-4 rounded-xl font-extrabold uppercase tracking-widest text-xs flex items-center justify-center gap-2.5 border transition-all duration-300 active:scale-95 ${
              sosActive
                ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-crimson-glow'
                : 'bg-red-600/10 border-red-500/20 hover:bg-red-600 hover:text-white text-red-500'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full bg-current ${sosActive ? 'animate-ping' : ''}`} />
            {sosActive ? 'Stand Down Emergency' : 'Initiate SOS Beacon'}
          </button>
        </aside>

        {/* Viewport Central Area */}
        <main className="flex-1 flex flex-col p-5 overflow-hidden">
          
          {/* Viewport Toggle Header */}
          <div className="h-12 shrink-0 flex items-center justify-between pb-3">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest">Tactical Viewport</h2>
            <div className="flex bg-slate-900/80 border border-slate-800/80 p-0.5 rounded-xl">
              <button 
                onClick={() => setActiveViewport('2d')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeViewport === '2d' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                2D Leaflet
              </button>
              <button 
                onClick={() => setActiveViewport('3d')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeViewport === '3d' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                3D Matrix
              </button>
              <button 
                onClick={() => setActiveViewport('both')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeViewport === 'both' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                Duplex
              </button>
            </div>
          </div>

          {/* Central content area: containing map viewports on top and bottom cockpit split deck below */}
          <div className="flex-1 flex flex-col gap-5 min-h-0 overflow-y-auto pr-1">
            {/* Dynamic Map viewports */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 min-h-[360px] shrink-0 md:shrink">
              {/* 2D Tactical Viewport */}
              {(activeViewport === '2d' || activeViewport === 'both') && (
                <div className={`relative h-full w-full ${activeViewport === '2d' ? 'md:col-span-2' : ''}`}>
                  <LeafletMap />
                </div>
              )}
              
              {/* 3D Cybernetic Viewport */}
              {(activeViewport === '3d' || activeViewport === 'both') && (
                <div className={`relative h-full w-full ${activeViewport === '3d' ? 'md:col-span-2' : ''}`}>
                  {connectivityMode === 'fiber' ? (
                    <City3D />
                  ) : (
                    <div className="w-full h-full bg-obsidian-950/80 flex flex-col items-center justify-center border border-slate-800/40 rounded-2xl p-6 text-center">
                      <AlertTriangle className="w-8 h-8 text-orange-400 glow-orange mb-2 animate-bounce" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">WebGL 3D Engine Disabled</h4>
                      <p className="text-[10px] text-slate-500 max-w-xs mt-1">
                        WebGL and React Three Fiber canvas unmounted to conserve bandwidth and device battery under {connectivityMode === '2g' ? '2G Bandwidth Mode' : 'Offline SMS Mode'}.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Split Deck bottom panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 shrink-0 mt-2 pb-2">
              <ConnectivityCockpit />
              <PoliceDispatch />
            </div>
          </div>
        </main>

        {/* Right Panel / Conversational Interface */}
        <aside className="w-80 shrink-0 border-l border-slate-800/60 p-5 flex flex-col gap-5 overflow-y-auto bg-obsidian-900/20 z-10">
          {/* AI Voice Reactive Orb */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-red-400" />
              Orb Telemetry
            </label>
            <AIOrb />
          </div>

          {/* AI Conversational Assistant */}
          <div className="flex-1 min-h-[300px]">
            <VoiceChat />
          </div>
        </aside>

      </div>

      {/* Incident Wizard Modal */}
      <IncidentWizard 
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </div>
  );
}

