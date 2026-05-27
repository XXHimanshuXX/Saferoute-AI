'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useMapStore, Incident } from '@/store/useMapStore';

// Coordinate translation: Dynamic bounds mapping relative to current map center
const latScale = 4000;
const lngScale = 4000;

const get3DCoords = (lat: number, lng: number, centerLat: number, centerLng: number) => {
  const x = (lng - centerLng) * lngScale;
  const z = -(lat - centerLat) * latScale; // invert lat to match WebGL z-axis
  return [x, 0.4, z] as [number, number, number];
};

// Procedural City Grid Builder
const ProceduralCity: React.FC = () => {
  const sosActive = useMapStore((state) => state.sosActive);
  const buildings = useMemo(() => {
    const list = [];
    const gridWidth = 12;
    const gridLength = 12;
    const spacing = 2.0;
    
    // Seeded random helper
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    let seed = 42;
    for (let x = -gridWidth / 2; x < gridWidth / 2; x++) {
      for (let z = -gridLength / 2; z < gridLength / 2; z++) {
        // Keep center clearing open for route visuals
        if (Math.abs(x) < 1.5 && Math.abs(z) < 1.5) continue;
        
        const hRand = seededRandom(seed++);
        const wRand = seededRandom(seed++);
        const dRand = seededRandom(seed++);

        const height = hRand * 4.5 + 1.2;
        const width = wRand * 0.4 + 0.7;
        const depth = dRand * 0.4 + 0.7;
        
        list.push({
          id: `b-${x}-${z}`,
          x: x * spacing + (seededRandom(seed++) - 0.5) * 0.4,
          z: z * spacing + (seededRandom(seed++) - 0.5) * 0.4,
          height,
          width,
          depth,
          isHighrise: height > 3.8
        });
      }
    }
    return list;
  }, []);

  return (
    <group>
      {/* Grid Floor */}
      <gridHelper args={[40, 40, sosActive ? '#ef4444' : '#1e293b', '#0f172a']} position={[0, -0.01, 0]} />

      {/* Procedural Buildings */}
      {buildings.map((b) => (
        <group key={b.id} position={[b.x, b.height / 2, b.z]}>
          {/* Main extruded block mesh */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.width, b.height, b.depth]} />
            <meshStandardMaterial 
              color={sosActive ? '#2c0c10' : (b.isHighrise ? '#0b1329' : '#070a12')} 
              roughness={0.5} 
              metalness={0.9} 
              transparent
              opacity={0.92}
            />
          </mesh>
          {/* Futuristic Glowing Wireframe Outline */}
          <mesh>
            <boxGeometry args={[b.width * 1.005, b.height * 1.005, b.depth * 1.005]} />
            <meshBasicMaterial 
              color={sosActive ? '#ef4444' : (b.isHighrise ? '#10b981' : '#3b82f6')} 
              wireframe 
              transparent 
              opacity={sosActive ? 0.16 : (b.isHighrise ? 0.08 : 0.04)} 
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Individually animated incident beacon
interface BeaconProps {
  incident: Incident;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  mapCenter: [number, number];
}

const Beacon3D: React.FC<BeaconProps> = ({ incident, hoveredId, setHoveredId, mapCenter }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  
  const isHovered = hoveredId === incident.id;
  const [x, y, z] = get3DCoords(incident.lat, incident.lng, mapCenter[0], mapCenter[1]);

  // Alert colors mapping
  let colorStr = '#10b981'; // safezone -> emerald
  if (incident.type === 'hazard') {
    colorStr = '#f97316'; // warning -> orange
  } else if (incident.type === 'sos') {
    colorStr = '#ef4444'; // SOS alert -> crimson
  }

  const color = useMemo(() => new THREE.Color(colorStr), [colorStr]);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    if (meshRef.current) {
      const targetScale = isHovered ? 2.5 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
      
      meshRef.current.position.y = y + Math.sin(elapsed * 3.5 + incident.lat) * 0.1;
      meshRef.current.rotation.y += 0.015;
    }

    if (ringRef.current) {
      const scaleVal = 1.0 + (elapsed * 2.0 % 2.0);
      ringRef.current.scale.set(scaleVal, scaleVal, 1);
      
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 0.45 * (1.0 - (elapsed * 2.0 % 2.0) / 2.0));
    }

    if (lightRef.current) {
      const pulseIntensity = isHovered 
        ? 6.0 
        : 1.5 + Math.sin(elapsed * 6.0) * 0.5;
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, pulseIntensity, 0.2);
    }
  });

  return (
    <group position={[x, y, z]}>
      {/* Emissive light casting onto surrounding geometry */}
      <pointLight 
        ref={lightRef} 
        color={colorStr} 
        distance={6} 
        decay={1.8} 
        intensity={1.5}
      />
      
      {/* Hologram core sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId(incident.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredId(null);
        }}
      >
        <octahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 4.5 : 1.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Cyberpunk Threat light shaft towers */}
      {incident.type === 'hazard' && (
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 4, 16]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.18} />
        </mesh>
      )}
      {incident.type === 'sos' && (
        <mesh position={[0, 3, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 6, 16]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.28} />
        </mesh>
      )}
      
      {/* Ground Projection Pulse Ring */}
      <mesh 
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -y + 0.05, 0]}
      >
        <ringGeometry args={[0.15, 0.42, 24]} />
        <meshBasicMaterial 
          color={colorStr} 
          transparent 
          opacity={0.35} 
          side={THREE.DoubleSide} 
        />
      </mesh>
    </group>
  );
};

// Route Render Components
const Route3D: React.FC<{ mapCenter: [number, number] }> = ({ mapCenter }) => {
  const currentRoute = useMapStore((state) => state.currentRoute);

  const points = useMemo(() => {
    if (!currentRoute) return [];
    return currentRoute.coordinates.map(c => {
      const [x, _, z] = get3DCoords(c.lat, c.lng, mapCenter[0], mapCenter[1]);
      return new THREE.Vector3(x, 0.15, z);
    });
  }, [currentRoute, mapCenter]);

  const routeColor = useMemo(() => {
    if (!currentRoute) return '#10b981';
    const colBand = currentRoute.segments[0]?.color;
    return colBand === 'crimson' ? '#ef4444' : colBand === 'orange' ? '#f97316' : '#10b981';
  }, [currentRoute]);

  if (points.length < 2) return null;

  return (
    <group>
      {/* Segment rendering to project neon tubes dynamically */}
      {points.map((p, idx) => {
        if (idx === points.length - 1) return null;
        const next = points[idx + 1];
        
        const midPoint = new THREE.Vector3().addVectors(p, next).multiplyScalar(0.5);
        const distance = p.distanceTo(next);
        
        const direction = new THREE.Vector3().subVectors(next, p).normalize();
        const cylinderAxis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(cylinderAxis, direction);

        return (
          <group key={`seg-${idx}`} position={midPoint} quaternion={quaternion}>
            {/* Inner neon wire */}
            <mesh>
              <cylinderGeometry args={[0.035, 0.035, distance, 8]} />
              <meshBasicMaterial color={routeColor} transparent opacity={0.8} />
            </mesh>
            {/* Outer glowing jacket */}
            <mesh>
              <cylinderGeometry args={[0.085, 0.085, distance, 8]} />
              <meshBasicMaterial color={routeColor} transparent opacity={0.18} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const City3D: React.FC = () => {
  const { incidents, hoveredId, setHoveredId, sosActive, mapCenter } = useMapStore();

  return (
    <div className={`w-full h-full bg-obsidian-950 rounded-2xl overflow-hidden border relative transition-all duration-500 ${
      sosActive ? 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-slate-800/40'
    }`}>
      {/* Tactical Canvas Controls Overlay info */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h4 className={`text-[10px] font-black uppercase tracking-widest bg-obsidian-900/80 px-2.5 py-1 rounded-md border backdrop-blur-md transition-colors ${
          sosActive ? 'text-red-400 border-red-500/20' : 'text-emerald-400 border-emerald-500/20'
        }`}>
          3D City Pulse Map {sosActive && '• SOS DISTRESS'}
        </h4>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={45} />
        
        {sosActive ? (
          <ambientLight intensity={0.35} color="#ef4444" />
        ) : (
          <ambientLight intensity={0.12} />
        )}
        
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={0.4} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        
        <directionalLight position={[-10, 5, -10]} color={sosActive ? '#ef4444' : '#3b82f6'} intensity={sosActive ? 0.4 : 0.25} />
        <directionalLight position={[10, -5, 10]} color={sosActive ? '#b91c1c' : '#10b981'} intensity={sosActive ? 0.2 : 0.12} />

        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.05} 
          minDistance={3}
          maxDistance={25}
        />

        {/* Procedural city blocks */}
        <ProceduralCity />

        {/* Active Route vectors synced to actual mapCenter */}
        <Route3D mapCenter={mapCenter} />

        {/* Dynamic Incidents / Safety Beacons synced to actual mapCenter */}
        {incidents.map((incident) => (
          <Beacon3D 
            key={incident.id} 
            incident={incident} 
            hoveredId={hoveredId} 
            setHoveredId={setHoveredId}
            mapCenter={mapCenter}
          />
        ))}
      </Canvas>
    </div>
  );
};

export default City3D;
