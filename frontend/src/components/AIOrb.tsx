'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMapStore } from '@/store/useMapStore';
import { Mic, MicOff, Sparkles } from 'lucide-react';

interface AnimatedOrbProps {
  volume: number;
  colorStr: string;
}

const AnimatedOrb: React.FC<AnimatedOrbProps> = ({ volume, colorStr }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => new THREE.Color(colorStr), [colorStr]);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    if (meshRef.current) {
      // Rotate orb
      meshRef.current.rotation.y = elapsed * 0.4;
      meshRef.current.rotation.x = elapsed * 0.2;

      // Base scaling + audio amplitude scaling
      const basePulse = 1.0 + Math.sin(elapsed * 2.0) * 0.08;
      const audioScale = basePulse + volume * 0.85;
      
      meshRef.current.scale.lerp(new THREE.Vector3(audioScale, audioScale, audioScale), 0.18);

      // Procedural distortion in material via emissive intensity pulses
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 1.2 + Math.sin(elapsed * 5.0) * 0.4 + volume * 2.0;
      material.emissive.lerp(color, 0.1);
      material.color.lerp(color, 0.1);
    }
  });

  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshStandardMaterial
        color={colorStr}
        emissive={colorStr}
        emissiveIntensity={1.5}
        roughness={0.05}
        metalness={0.9}
        wireframe={false}
      />
    </mesh>
  );
};

export const AIOrb: React.FC = () => {
  const { sosActive, safetyScore } = useMapStore();
  const [micActive, setMicActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const micActiveRef = useRef(false);

  // Set colors based on state
  let colorStr = '#10b981'; // emerald - secure
  let statusText = 'SafeRoute Core AI Online';
  let badgeColor = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';

  if (sosActive) {
    colorStr = '#ef4444'; // crimson - SOS active
    statusText = 'Emergency SOS Alert Stream Active';
    badgeColor = 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse';
  } else if (safetyScore < 60) {
    colorStr = '#f97316'; // orange - warnings nearby
    statusText = 'Localized Safety Advisories Active';
    badgeColor = 'bg-orange-500/10 border-orange-500/30 text-orange-400';
  }

  // Setup Mic Analyzer & Web Speech Recognition
  const toggleMic = async () => {
    if (micActive) {
      cleanupAudio();
      setMicActive(false);
      micActiveRef.current = false;
      setVolume(0);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      setMicActive(true);
      micActiveRef.current = true;

      // Initialize Web Speech Recognition
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        const rec = new SpeechRecognitionClass();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'en-IN'; // optimized for Indian accents, supporting Hinglish/English mix

        rec.onresult = (event: any) => {
          const result = event.results[event.results.length - 1];
          if (result.isFinal) {
            const transcript = result[0].transcript;
            console.log('Voice recognized:', transcript);
            window.dispatchEvent(new CustomEvent('voice-input', { detail: transcript }));
          }
        };

        rec.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
        };

        rec.onend = () => {
          // Auto restart speech recognition if mic is still active
          if (micActiveRef.current) {
            try {
              rec.start();
            } catch (err) {
              console.warn('Speech recognition failed to restart:', err);
            }
          }
        };

        recognitionRef.current = rec;
        rec.start();
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const processAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        // Normalize volume value between 0 and 1
        setVolume(avg / 128);

        animationFrameRef.current = requestAnimationFrame(processAudio);
      };

      processAudio();
    } catch (err) {
      console.warn('Microphone permission denied or unsupported:', err);
      alert('Could not access microphone. AI Orb will use simulated voice pulse.');
    }
  };

  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch (err) {}
      recognitionRef.current = null;
    }
    analyserRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
  };

  // Simulate subtle ambient speech fluctuations when microphone is off
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!micActive) {
      interval = setInterval(() => {
        // Random simulated vocal fluctuations
        setVolume(Math.random() * 0.15);
      }, 200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [micActive]);

  useEffect(() => {
    return () => cleanupAudio();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl glass-panel relative overflow-hidden h-[340px]">
      {/* Decorative Grid Mesh */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

      {/* R3F WebGL canvas for AI Orb */}
      <div className="w-full h-48 cursor-pointer relative z-10">
        <Canvas camera={{ position: [0, 0, 4], fov: 60 }} shadows>
          <ambientLight intensity={0.15} />
          <pointLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-5, 5, -5]} intensity={0.4} color="#3b82f6" />
          
          <AnimatedOrb volume={volume} colorStr={colorStr} />
        </Canvas>
      </div>

      {/* Voice telemetry status */}
      <div className="mt-4 text-center z-10 flex flex-col items-center">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-widest ${badgeColor}`}>
          <Sparkles className="w-3.5 h-3.5" />
          {statusText}
        </div>
        <p className="text-xs text-slate-400 mt-2 max-w-[240px] leading-relaxed">
          {micActive 
            ? 'Actively capturing voice levels. AI responds in real-time.' 
            : 'Click mic icon to activate voice-responsive navigation mode.'}
        </p>
      </div>

      {/* Mic activation toggle trigger */}
      <button
        onClick={toggleMic}
        className={`absolute bottom-4 right-4 p-3 rounded-xl border transition-all active:scale-95 duration-200 ${
          micActive 
            ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
        }`}
      >
        {micActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default AIOrb;
