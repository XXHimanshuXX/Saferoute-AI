import { create } from 'zustand';

export interface PCRVehicle {
  id: string;
  name: string;
  type: 'van' | 'bike' | 'volunteer';
  lat: number;
  lng: number;
  status: 'idle' | 'dispatched' | 'arrived';
  eta?: number;
}

export interface Incident {
  id: string;
  type: 'hazard' | 'safezone' | 'sos';
  category: string;
  lat: number;
  lng: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  trustScore?: number;
  upvotesCount?: number;
  downvotesCount?: number;
}

export interface RouteSegment {
  lat: number;
  lng: number;
}

export interface RouteData {
  coordinates: RouteSegment[];
  segments: {
    color: 'emerald' | 'orange' | 'crimson';
    startIndex: number;
    endIndex: number;
  }[];
  duration: number; // in minutes
  distance: number; // in miles
  safetyScore: number; // 0 - 100
}

interface MapState {
  incidents: Incident[];
  hoveredId: string | null;
  currentRoute: RouteData | null;
  sosActive: boolean;
  safetyScore: number;
  mapCenter: [number, number];
  zoom: number;
  
  // Connectivity Cockpit State
  connectivityMode: 'fiber' | '2g' | 'offline';
  
  // PCR Vehicles Telemetry
  pcrVehicles: PCRVehicle[];
  
  // Actions
  setHoveredId: (id: string | null) => void;
  setSosActive: (active: boolean) => void;
  setSafetyScore: (score: number) => void;
  setMapCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setCurrentRoute: (route: RouteData | null) => void;
  addIncident: (incident: Incident) => void;
  setIncidents: (incidents: Incident[]) => void;
  setConnectivityMode: (mode: 'fiber' | '2g' | 'offline') => void;
  setPCRVehicles: (vehicles: PCRVehicle[]) => void;
  dispatchVehicle: (id: string) => void;
  voteIncident: (id: string, voteType: 'upvote' | 'downvote') => Promise<void>;
}

const mockIncidents: Incident[] = [
  {
    id: 'inc-1',
    type: 'hazard',
    category: 'Civil Lines Crossing',
    lat: 26.9185,
    lng: 75.7873,
    description: 'Broken streetlight corridor. High threat level at evening hours.',
    severity: 'high',
    timestamp: new Date(),
    trustScore: 1.0,
    upvotesCount: 0,
    downvotesCount: 0
  },
  {
    id: 'inc-2',
    type: 'hazard',
    category: 'Bapu Nagar Alleyways',
    lat: 26.9052,
    lng: 75.8065,
    description: 'Elevated crime clusters and blind spot reporting.',
    severity: 'high',
    timestamp: new Date(),
    trustScore: 1.2,
    upvotesCount: 1,
    downvotesCount: 0
  },
  {
    id: 'inc-3',
    type: 'hazard',
    category: 'Sodala Construction Corridor',
    lat: 26.922,
    lng: 75.775,
    description: 'Dark construction area, pedestrian access not optimized.',
    severity: 'medium',
    timestamp: new Date(),
    trustScore: 0.7,
    upvotesCount: 0,
    downvotesCount: 1
  },
  {
    id: 'inc-4',
    type: 'hazard',
    category: 'Tonk Road Overpass',
    lat: 26.899,
    lng: 75.776,
    description: 'Broken emergency calling systems and low-lit walkway.',
    severity: 'medium',
    timestamp: new Date(),
    trustScore: 1.0,
    upvotesCount: 0,
    downvotesCount: 0
  },
  {
    id: 'inc-5',
    type: 'hazard',
    category: 'C-Scheme Alleys',
    lat: 26.914,
    lng: 75.799,
    description: 'Frequent reported safety alerts. Avoid after 10 PM.',
    severity: 'high',
    timestamp: new Date(),
    trustScore: 1.5,
    upvotesCount: 3,
    downvotesCount: 0
  },
  {
    id: 'inc-6',
    type: 'safezone',
    category: 'Central Command Precinct',
    lat: 26.9124,
    lng: 75.7873,
    description: 'Police hub booth with 24/7 CCTV surveillance and security staff.',
    severity: 'low',
    timestamp: new Date(),
    trustScore: 2.0,
    upvotesCount: 5,
    downvotesCount: 0
  },
  {
    id: 'inc-7',
    type: 'safezone',
    category: 'North Sector Safe Haven',
    lat: 26.919,
    lng: 75.801,
    description: 'Well-lit municipal facility with emergency SOS panic button.',
    severity: 'low',
    timestamp: new Date(),
    trustScore: 1.0,
    upvotesCount: 0,
    downvotesCount: 0
  },
  {
    id: 'inc-8',
    type: 'safezone',
    category: 'West Safe Haven Shop',
    lat: 26.905,
    lng: 75.77,
    description: 'Partner merchant offering safe sanctuary, phone charging, and security link.',
    severity: 'low',
    timestamp: new Date(),
    trustScore: 1.2,
    upvotesCount: 1,
    downvotesCount: 0
  }
];

const initialPcrVehicles: PCRVehicle[] = [
  { id: 'pcr-1', name: 'PCR Van Alpha', type: 'van', lat: 26.915, lng: 75.780, status: 'idle', eta: 4 },
  { id: 'pcr-2', name: 'Patrol Bike Beta', type: 'bike', lat: 26.908, lng: 75.795, status: 'idle', eta: 2 },
  { id: 'pcr-3', name: 'Guardian Shanti (Citizen)', type: 'volunteer', lat: 26.919, lng: 75.790, status: 'idle', eta: 3 }
];

export const useMapStore = create<MapState>((set) => ({
  incidents: mockIncidents,
  hoveredId: null,
  currentRoute: {
    coordinates: [
      { lat: 26.9124, lng: 75.772 },
      { lat: 26.9135, lng: 75.78 },
      { lat: 26.914, lng: 75.788 },
      { lat: 26.916, lng: 75.796 },
      { lat: 26.918, lng: 75.802 },
      { lat: 26.9195, lng: 75.808 }
    ],
    segments: [
      { color: 'emerald', startIndex: 0, endIndex: 2 },
      { color: 'orange', startIndex: 2, endIndex: 4 },
      { color: 'crimson', startIndex: 4, endIndex: 5 }
    ],
    duration: 18,
    distance: 2.3,
    safetyScore: 84
  },
  sosActive: false,
  safetyScore: 84,
  mapCenter: [26.9124, 75.7873],
  zoom: 14,
  
  connectivityMode: 'fiber',
  pcrVehicles: initialPcrVehicles,

  setHoveredId: (id) => set({ hoveredId: id }),
  setSosActive: (active) => set({ sosActive: active }),
  setSafetyScore: (score) => set({ safetyScore: score }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setZoom: (zoom) => set({ zoom }),
  setCurrentRoute: (route) => set({ 
    currentRoute: route,
    safetyScore: route ? route.safetyScore : 100 
  }),
  addIncident: (incident) => set((state) => ({ 
    incidents: [incident, ...state.incidents] 
  })),
  setIncidents: (incidents) => set({ incidents }),
  
  setConnectivityMode: (mode) => set({ connectivityMode: mode }),
  setPCRVehicles: (vehicles) => set({ pcrVehicles: vehicles }),
  
  dispatchVehicle: (id) => set((state) => ({
    pcrVehicles: state.pcrVehicles.map(v => 
      v.id === id ? { ...v, status: v.status === 'idle' ? 'dispatched' : 'idle' } : v
    )
  })),
  
  voteIncident: async (id, voteType) => {
    // Generate or get device fingerprint from localStorage
    let fingerprint = 'local_device';
    if (typeof window !== 'undefined') {
      let storedFp = localStorage.getItem('saferoute_fingerprint');
      if (!storedFp) {
        storedFp = 'usr_fp_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('saferoute_fingerprint', storedFp);
      }
      fingerprint = storedFp;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/safety/incidents/${id}/vote`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint, voteType })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        set((state) => ({
          incidents: state.incidents.map((inc) => {
            if (inc.id === id) {
              return {
                ...inc,
                trustScore: result.trustScore,
                upvotesCount: result.upvotesCount,
                downvotesCount: result.downvotesCount
              };
            }
            return inc;
          })
        }));
      } else {
        // Mock fallback if offline/backend down
        console.warn('Backend offline, running local mock vote.');
        set((state) => ({
          incidents: state.incidents.map((inc) => {
            if (inc.id === id) {
              const prevUpvotes = inc.upvotesCount || 0;
              const prevDownvotes = inc.downvotesCount || 0;
              
              let newUpvotes = prevUpvotes;
              let newDownvotes = prevDownvotes;
              
              if (voteType === 'upvote') {
                newUpvotes += 1;
              } else {
                newDownvotes += 1;
              }
              
              const newScore = Math.max(0.1, 1.0 + (newUpvotes * 0.2) - (newDownvotes * 0.3));
              
              return {
                ...inc,
                trustScore: Math.round(newScore * 10) / 10,
                upvotesCount: newUpvotes,
                downvotesCount: newDownvotes
              };
            }
            return inc;
          })
        }));
      }
    } catch (error) {
      console.error('Failed to vote incident:', error);
      // Fallback
      set((state) => ({
        incidents: state.incidents.map((inc) => {
          if (inc.id === id) {
            const prevUpvotes = inc.upvotesCount || 0;
            const prevDownvotes = inc.downvotesCount || 0;
            const newUp = voteType === 'upvote' ? prevUpvotes + 1 : prevUpvotes;
            const newDown = voteType === 'downvote' ? prevDownvotes + 1 : prevDownvotes;
            const newScore = Math.max(0.1, 1.0 + (newUp * 0.2) - (newDown * 0.3));
            
            return {
              ...inc,
              trustScore: Math.round(newScore * 10) / 10,
              upvotesCount: newUp,
              downvotesCount: newDown
            };
          }
          return inc;
        })
      }));
    }
  }
}));
