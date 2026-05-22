'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMapStore } from '@/store/useMapStore';
import { AlertOctagon, ShieldAlert, PhoneCall, Radio, Eye } from 'lucide-react';

export const SOSHeartbeat: React.FC = () => {
  const { sosActive, setSosActive } = useMapStore();
  const [secondsActive, setSecondsActive] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger web audio beep
  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Safety check if audio context is suspended
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Oscillator for alert sound
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Distressed dual-tone alarm pattern
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.warn('WebAudio failed to play:', err);
    }
  };

  useEffect(() => {
    if (sosActive) {
      setSecondsActive(0);
      
      // Play sound immediately and set interval
      playAlertSound();
      alarmIntervalRef.current = setInterval(() => {
        playAlertSound();
        setSecondsActive(prev => prev + 1);

        // Vibrate mobile device (pattern: vibrate 300ms, pause 150ms)
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([300, 150, 300]);
        }
      }, 1000);
    } else {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    }

    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, [sosActive]);

  if (!sosActive) return null;

  // Mock distance details in kilometers
  const nearestPolice = Math.max(0.1, 1.8 - secondsActive * 0.03).toFixed(2);
  const nearestEscort = Math.max(0.05, 1.1 - secondsActive * 0.02).toFixed(2);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-500 pointer-events-auto">
      {/* Fullscreen crimson vignette heartbeat */}
      <div className="absolute inset-0 pointer-events-none sos-overlay-pulse z-0" />

      {/* Main SOS Panel */}
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-3xl glass-panel-heavy border-red-500/30 p-8 text-center flex flex-col items-center shadow-crimson-glow overflow-hidden">
        {/* Decorative Grid Line backdrop */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ef4444_1px,transparent_1px),linear-gradient(to_bottom,#ef4444_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        {/* Pulsing Beacon Icon */}
        <div className="relative flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full border border-red-500/30 animate-pulse mb-6">
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping opacity-75" />
          <ShieldAlert className="w-10 h-10 text-red-500 glow-crimson" />
        </div>

        {/* Alarm Banner */}
        <h1 className="text-3xl font-black text-red-500 uppercase tracking-tighter glow-crimson animate-pulse">
          Emergency SOS Broadcasting
        </h1>
        <p className="text-sm font-medium text-slate-400 mt-2">
          Your location and real-time audio telemetry are being transmitted.
        </p>

        {/* Transmission telemetry info */}
        <div className="w-full mt-6 grid grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-4 border-red-500/10">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-red-400 uppercase mb-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Telemetry
            </div>
            <p className="text-lg font-black text-slate-200">ACTIVE</p>
            <p className="text-[10px] text-slate-500 mt-1">Uptime: {secondsActive}s</p>
          </div>
          <div className="glass-card rounded-2xl p-4 border-red-500/10">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
              <Eye className="w-3.5 h-3.5" /> Guardians
            </div>
            <p className="text-lg font-black text-slate-200">5 Nearby</p>
            <p className="text-[10px] text-slate-500 mt-1">Alert dispatched</p>
          </div>
        </div>

        {/* Live Distance Trackers */}
        <div className="w-full mt-4 glass-card border-red-500/10 rounded-2xl p-5 text-left space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            First Responder Intercepts
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-red-400" /> Jaipur PCR / Rajasthan 112
              </span>
              <span className="text-red-400 font-extrabold">{nearestPolice} km</span>
            </div>
            <div className="w-full bg-slate-800/40 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-red-500 h-full transition-all duration-1000" 
                style={{ width: `${Math.max(10, Math.min(100, ((1.8 - parseFloat(nearestPolice)) / 1.8) * 100))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-medium pt-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-orange-400" /> Rajasthan Patrol Sector 7
              </span>
              <span className="text-orange-400 font-extrabold">{nearestEscort} km</span>
            </div>
            <div className="w-full bg-slate-800/40 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-orange-500 h-full transition-all duration-1000" 
                style={{ width: `${Math.max(10, Math.min(100, ((1.1 - parseFloat(nearestEscort)) / 1.1) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Big Action Abort button */}
        <button
          onClick={() => setSosActive(false)}
          className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold tracking-widest text-sm shadow-md transition-all active:scale-95 duration-200 border border-red-500/20 relative group"
        >
          {/* Pulse ring inside button */}
          <div className="absolute inset-0 rounded-2xl border-2 border-white/10 animate-ping scale-95 opacity-0 group-hover:opacity-100 duration-500 pointer-events-none" />
          STAND DOWN - SYSTEM RECOVERY
        </button>
      </div>
    </div>
  );
};
