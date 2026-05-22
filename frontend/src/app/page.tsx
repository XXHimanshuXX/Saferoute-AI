import Link from 'next/link';
import { Compass, Shield, Radio, Sparkles, ArrowRight, Zap, Eye, AlertOctagon, Heart } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-obsidian-950 flex flex-col justify-between relative overflow-hidden font-sans text-slate-200">
      
      {/* Dynamic background accents */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] -top-40 -left-40 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] -bottom-40 -right-40 pointer-events-none" />
      
      {/* Decorative full grid mesh overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <header className="h-20 max-w-7xl mx-auto w-full px-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9.5 h-9.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Compass className="w-5 h-5 text-emerald-400 glow-emerald" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white">
              SafeRoute AI
            </h1>
            <p className="text-[9px] text-slate-500 font-black tracking-widest uppercase">Escort Systems</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>Enterprise Secure v2.0</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 relative z-10 max-w-7xl mx-auto w-full py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Navigation Platform
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight">
              Tactical Escort & <br />
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Emergency Routing
              </span>
            </h1>
            
            <p className="text-sm md:text-base text-slate-400 max-w-xl leading-relaxed">
              SafeRoute AI integrates real-time safety scores, low-light street mapping, and advanced WebGL city grids to guide you securely. Powered by a voice-reactive co-navigator and instant SOS distress networks.
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <Link href="/dashboard">
                <button className="px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 duration-200 border border-emerald-500/20 shadow-lg shadow-emerald-950/20 group">
                  Access Tactical Workspace 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>

          {/* Hero Right Visual Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            
            <div className="glass-panel p-5 rounded-2xl border-emerald-500/10 flex flex-col justify-between h-44 hover:border-emerald-500/20 transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-emerald-400 glow-emerald" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">94% Accuracy</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Safety scores derived from local datasets, light lux ratings, and reported incident clusters.</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-blue-500/10 flex flex-col justify-between h-44 hover:border-blue-500/20 transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Zap className="w-4.5 h-4.5 text-blue-400 glow-blue" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">3D City Matrix</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Extruded holographic structures sync markers to visualize threat spheres interactively.</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-red-500/10 flex flex-col justify-between h-44 hover:border-red-500/20 transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Radio className="w-4.5 h-4.5 text-red-500 glow-crimson" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">SOS Distress</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Repeating audio alerts, hardware feedback loops, and live dispatch intercept tracking.</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-slate-800 flex flex-col justify-between h-44 hover:border-slate-700 transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-slate-800/40 border border-slate-700 flex items-center justify-center">
                <Eye className="w-4.5 h-4.5 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">RAG Copilot</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Co-navigator responds with safe alternate routing suggestions instantly.</p>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 shrink-0 border-t border-slate-900 flex items-center justify-between px-6 max-w-7xl mx-auto w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 relative z-10">
        <span>© SafeRoute AI Inc. All telemetry encrypted under secure network layers.</span>
        <span className="flex items-center gap-1">Developed with <Heart className="w-3 h-3 text-red-500" /> by Antialiasing Team</span>
      </footer>

    </div>
  );
}
