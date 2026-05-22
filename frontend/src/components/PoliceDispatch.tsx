'use client';

import React from 'react';
import { useMapStore, PCRVehicle } from '@/store/useMapStore';
import { Shield, ShieldAlert, Truck, Bike, UserCheck, Volume2, Navigation } from 'lucide-react';

export const PoliceDispatch: React.FC = () => {
  const { pcrVehicles, dispatchVehicle } = useMapStore();

  const playDispatchSiren = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      // Siren sound signature: Dual oscillator sweep
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(350, audioCtx.currentTime);
      osc1.frequency.linearRampToValueAtTime(650, audioCtx.currentTime + 0.25);
      osc1.frequency.linearRampToValueAtTime(350, audioCtx.currentTime + 0.5);
      osc1.frequency.linearRampToValueAtTime(550, audioCtx.currentTime + 0.75);
      osc1.frequency.linearRampToValueAtTime(250, audioCtx.currentTime + 1.0);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(354, audioCtx.currentTime);
      osc2.frequency.linearRampToValueAtTime(654, audioCtx.currentTime + 0.25);
      osc2.frequency.linearRampToValueAtTime(354, audioCtx.currentTime + 0.5);
      osc2.frequency.linearRampToValueAtTime(554, audioCtx.currentTime + 0.75);
      osc2.frequency.linearRampToValueAtTime(254, audioCtx.currentTime + 1.0);

      gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 1.0);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      
      osc1.stop(audioCtx.currentTime + 1.05);
      osc2.stop(audioCtx.currentTime + 1.05);
    } catch (err) {
      console.warn('Audio Context blocked or unsupported:', err);
    }
  };

  const handleDispatch = (id: string) => {
    dispatchVehicle(id);
    playDispatchSiren();
  };

  const getVehicleIcon = (type: PCRVehicle['type']) => {
    switch (type) {
      case 'van':
        return <Truck className="w-4 h-4 text-blue-400" />;
      case 'bike':
        return <Bike className="w-4 h-4 text-orange-450 text-orange-400" />;
      case 'volunteer':
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <Shield className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="glass-panel p-4.5 rounded-xl border border-slate-800/60 shadow-xl space-y-3.5 relative overflow-hidden">
      {/* Visual radar background details */}
      <div className="absolute -right-16 -top-16 w-32 h-32 border border-slate-800/40 rounded-full flex items-center justify-center pointer-events-none">
        <div className="w-20 h-20 border border-slate-800/30 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 bg-blue-500/5 rounded-full" />
        </div>
      </div>

      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400 glow-blue animate-pulse" />
            Rajasthan 112 PCR Command Panel
          </h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Emergency Dispatcher Coordinates
          </p>
        </div>
        <div className="flex items-center gap-1 border border-blue-500/20 bg-blue-950/40 px-2 py-0.5 rounded text-[8px] font-black uppercase text-blue-400">
          <Volume2 className="w-3 h-3 text-blue-400 animate-bounce" />
          WebAudio Siren Armed
        </div>
      </div>

      {/* Vehicles Status Table list */}
      <div className="space-y-2.5">
        {pcrVehicles.map((vehicle) => {
          const isDispatched = vehicle.status === 'dispatched';
          
          return (
            <div
              key={vehicle.id}
              className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                isDispatched
                  ? 'bg-blue-950/20 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                  : 'bg-obsidian-950/60 border-slate-800/80 hover:border-slate-800'
              }`}
            >
              {/* Left Info: Icon & Name details */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                  isDispatched
                    ? 'bg-blue-500/10 border-blue-500/30 glow-blue animate-pulse'
                    : 'bg-slate-900 border-slate-850'
                }`}>
                  {getVehicleIcon(vehicle.type)}
                </div>
                <div>
                  <h4 className="font-extrabold text-[11px] text-white tracking-tight flex items-center gap-1.5">
                    {vehicle.name}
                    {isDispatched && (
                      <span className="text-[7px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1 rounded animate-pulse">
                        Siren On
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-500 font-medium">
                    <span className="capitalize">{vehicle.type} Precinct</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-blue-400">
                      <Navigation className="w-2.5 h-2.5 shrink-0" />
                      ETA: {vehicle.eta}m
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Action: Status indicator & toggle button */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${
                    isDispatched
                      ? 'bg-blue-950/60 text-blue-400 border-blue-500/20 animate-pulse'
                      : 'bg-slate-900/60 text-slate-500 border-slate-800'
                  }`}>
                    {isDispatched ? '📢 DISPATCHED' : '💤 STANDBY'}
                  </span>
                </div>

                <button
                  onClick={() => handleDispatch(vehicle.id)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border transition-all active:scale-95 duration-200 ${
                    isDispatched
                      ? 'bg-red-950/20 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-white'
                      : 'bg-blue-600/10 border-blue-500/20 hover:bg-blue-600 hover:text-white text-blue-400'
                  }`}
                >
                  {isDispatched ? 'STAND DOWN' : 'DISPATCH UNIT'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[8px] text-slate-500 leading-tight text-center">
        *Dispatched vehicles automatically synchronize telemetry coordinate vectors to user's localized phone distress beacon.
      </div>
    </div>
  );
};
