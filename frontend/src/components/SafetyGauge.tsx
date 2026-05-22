'use client';

import React from 'react';
import { useMapStore } from '@/store/useMapStore';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

export const SafetyGauge: React.FC = () => {
  const safetyScore = useMapStore((state) => state.safetyScore);

  // SVG Circle calculations
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safetyScore / 100) * circumference;

  // Determine colors and icons based on safety score
  let strokeColor = '#10b981'; // safe - emerald
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let scoreClass = 'text-emerald-400';
  let ShieldIcon = ShieldCheck;

  if (safetyScore < 50) {
    strokeColor = '#ef4444'; // danger - crimson
    glowColor = 'rgba(239, 68, 68, 0.4)';
    scoreClass = 'text-red-400';
    ShieldIcon = ShieldAlert;
  } else if (safetyScore < 80) {
    strokeColor = '#f97316'; // warning - orange
    glowColor = 'rgba(249, 115, 22, 0.4)';
    scoreClass = 'text-orange-400';
    ShieldIcon = Shield;
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl glass-panel relative overflow-hidden group">
      {/* Light glow behind gauge */}
      <div 
        className="absolute w-24 h-24 rounded-full blur-3xl transition-all duration-1000"
        style={{ backgroundColor: strokeColor, opacity: 0.08 }}
      />

      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <ShieldIcon className="w-4 h-4" style={{ color: strokeColor }} />
        Zone Safety Rating
      </h3>

      <div className="relative w-36 h-36 flex items-center justify-center neomorphic-bg rounded-full p-2">
        {/* Ring shadow */}
        <div className="absolute inset-2 rounded-full neomorphic-inset" />

        <svg className="w-full h-full transform -rotate-90 z-10" viewBox="0 0 120 120">
          {/* Gauge Background Track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.02)"
            strokeWidth={strokeWidth}
          />
          {/* Active Gauge Value Arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.8s ease',
              filter: `drop-shadow(0 0 4px ${strokeColor})`,
            }}
          />
        </svg>

        {/* Dynamic Digital Readout inside gauge */}
        <div className="absolute flex flex-col items-center justify-center z-20">
          <span className={`text-3xl font-extrabold tracking-tighter ${scoreClass} transition-all duration-500`}>
            {safetyScore}
          </span>
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            Index Score
          </span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-slate-300">
          {safetyScore >= 80 ? 'Highly Secure Environment' : safetyScore >= 50 ? 'Moderate Alert Advisory' : 'Critical Hazard Boundary'}
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-[200px] leading-relaxed">
          {safetyScore >= 80 
            ? 'Optimal walking route. Excellent streetlighting and active safety beacons detected.' 
            : safetyScore >= 50 
              ? 'Warning: Minor incidents reported nearby. Stick to main avenues.' 
              : 'Detour highly recommended. Crime rates and dark zones are elevated.'}
        </p>
      </div>
    </div>
  );
};
