'use client';

import React, { useState, useEffect } from 'react';
import { useMapStore } from '@/store/useMapStore';
import { Wifi, ShieldAlert, Copy, Check, BatteryCharging, Radio, Database } from 'lucide-react';

export const ConnectivityCockpit: React.FC = () => {
  const { connectivityMode, setConnectivityMode, mapCenter } = useMapStore();
  const [copied, setCopied] = useState(false);
  const [addressDesc, setAddressDesc] = useState('Sector 7 Command Corridor, Jaipur');

  // Sync address descriptor with coordinates roughly for telemetry SMS
  useEffect(() => {
    const lat = mapCenter[0].toFixed(4);
    const lng = mapCenter[1].toFixed(4);
    if (mapCenter[0] > 26.915) setAddressDesc(`Civil Lines Command Zone (Lat: ${lat}, Lng: ${lng})`);
    else if (mapCenter[0] < 26.908) setAddressDesc(`Bapu Nagar Bypass Precinct (Lat: ${lat}, Lng: ${lng})`);
    else setAddressDesc(`Jaipur Sector 7 Precinct (Lat: ${lat}, Lng: ${lng})`);
  }, [mapCenter]);

  // Telemetry distress message formatted specifically for Rajasthan 112 distress SMS dispatch
  const distressMessage = `SOS DISTRESS ALERT | SAFEROUTE AI SOVEREIGN MESH\nPrecinct: ${addressDesc}\nCoordinates: [${mapCenter[0].toFixed(6)}, ${mapCenter[1].toFixed(6)}]\nBattery Level: Optimal | Hardware Sandbox Active\n[REQUEST DISPATCH RAJASTHAN POLICE 112 UNITS IMMEDIATE]`;

  const copyDistressPayload = () => {
    navigator.clipboard.writeText(distressMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-4.5 rounded-xl border border-slate-800/60 shadow-xl space-y-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-10 -left-10 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400 glow-blue animate-pulse" />
            Connectivity & Bandwidth Cockpit
          </h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Sovereign Telemetry Transmission Node
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[9px] text-slate-400 font-black uppercase">Local Sandbox OK</span>
        </div>
      </div>

      {/* Mode Switches Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Fiber link button */}
        <button
          onClick={() => setConnectivityMode('fiber')}
          className={`py-3 px-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 active:scale-95 text-xs ${
            connectivityMode === 'fiber'
              ? 'bg-blue-600/10 border-blue-500/40 text-white shadow-[0_0_12px_rgba(59,130,246,0.15)]'
              : 'bg-obsidian-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700/60 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-base">⚡</span>
            <span className={`text-[8px] font-black uppercase px-1 rounded ${
              connectivityMode === 'fiber' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'
            }`}>
              Gbps
            </span>
          </div>
          <div className="mt-2 text-left">
            <h4 className="font-extrabold text-[10px] tracking-tight">High-Speed Fiber</h4>
            <p className="text-[8px] text-slate-500 leading-tight mt-0.5 font-medium">3D Matrix view & live database synced.</p>
          </div>
        </button>

        {/* 2G link button */}
        <button
          onClick={() => setConnectivityMode('2g')}
          className={`py-3 px-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 active:scale-95 text-xs ${
            connectivityMode === '2g'
              ? 'bg-orange-600/10 border-orange-500/40 text-white shadow-[0_0_12px_rgba(249,115,22,0.15)]'
              : 'bg-obsidian-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700/60 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-base">📶</span>
            <span className={`text-[8px] font-black uppercase px-1 rounded ${
              connectivityMode === '2g' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-500'
            }`}>
              2G
            </span>
          </div>
          <div className="mt-2 text-left">
            <h4 className="font-extrabold text-[10px] tracking-tight">2G Mobile Network</h4>
            <p className="text-[8px] text-slate-500 leading-tight mt-0.5 font-medium">500m geofencing. 3D unmounted for battery.</p>
          </div>
        </button>

        {/* Offline SMS button */}
        <button
          onClick={() => setConnectivityMode('offline')}
          className={`py-3 px-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 active:scale-95 text-xs ${
            connectivityMode === 'offline'
              ? 'bg-red-600/10 border-red-500/40 text-white shadow-[0_0_12px_rgba(239,68,68,0.15)]'
              : 'bg-obsidian-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700/60 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-base">📡</span>
            <span className={`text-[8px] font-black uppercase px-1 rounded ${
              connectivityMode === 'offline' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-500'
            }`}>
              Offline
            </span>
          </div>
          <div className="mt-2 text-left">
            <h4 className="font-extrabold text-[10px] tracking-tight">Offline SMS SOS</h4>
            <p className="text-[8px] text-slate-500 leading-tight mt-0.5 font-medium">Local database, encrypted telemetry SMS.</p>
          </div>
        </button>
      </div>

      {/* Connectivity Status Info Bar */}
      <div className="bg-obsidian-950/80 rounded-xl border border-slate-850 p-3 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>
            {connectivityMode === 'fiber' && 'Data Ingestion: Complete active MongoDB real-time push streams'}
            {connectivityMode === '2g' && 'Data Ingestion: Compressed 2G REST protocols (500m active radius)'}
            {connectivityMode === 'offline' && 'Data Ingestion: Hardware Sandbox LocalDB isolated'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-extrabold text-slate-500 shrink-0">
          <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>94%</span>
        </div>
      </div>

      {/* If Offline Mode, show Copyable Telemetry distress SMS panel */}
      {connectivityMode === 'offline' && (
        <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-xs space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-red-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <ShieldAlert className="w-4 h-4 text-red-400 glow-crimson animate-pulse" />
              Offline SOS distress payload ready
            </h4>
            <span className="text-[8px] bg-red-500/10 border border-red-500/30 rounded px-1.5 text-red-400 font-extrabold">112 FORMAT</span>
          </div>
          
          <div className="bg-obsidian-950 p-2.5 rounded-lg border border-red-500/15 font-mono text-[9px] text-red-300 whitespace-pre-line leading-relaxed break-all select-all select-none">
            {distressMessage}
          </div>

          <button
            onClick={copyDistressPayload}
            className={`w-full py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all text-[10px] uppercase tracking-wider ${
              copied
                ? 'bg-emerald-600/10 border border-emerald-500/40 text-emerald-400'
                : 'bg-red-500/15 border border-red-500/30 text-white hover:bg-red-500/25 active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied Telemetry Data
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-red-400" />
                Copy Telemetry Distress SMS
              </>
            )}
          </button>
          <p className="text-[8px] text-slate-500 text-center leading-tight">
            *In offline areas without cellular data, copy this telemetry distress string and send to Rajasthan Police SOS Dispatch via standard SMS.
          </p>
        </div>
      )}
    </div>
  );
};
