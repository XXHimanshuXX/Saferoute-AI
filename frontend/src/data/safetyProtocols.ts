// Safety Protocols and Guidelines from Major Safety Platforms
// Inspired by Uber, Lyft, Google Maps, Waze, and personal safety apps

export const SAFETY_PROTOCOLS = {
  // Emergency Response Protocols
  EMERGENCY: {
    RESPONSE_TIMES: {
      IMMEDIATE: '0-2 minutes',
      URGENT: '2-5 minutes',
      STANDARD: '5-10 minutes',
      LOW_PRIORITY: '10+ minutes'
    },
    ALERT_LEVELS: {
      CRITICAL: 'critical',
      HIGH: 'high', 
      MEDIUM: 'medium',
      LOW: 'low'
    },
    CONTACTS: {
      EMERGENCY_SERVICES: ['911', '112', '999'],
      POLICE_NON_EMERGENCY: ['311', '101'],
      FIRE_DEPARTMENT: ['911', '112', '999'],
      MEDICAL_EMERGENCY: ['911', '112', '999'],
      POISON_CONTROL: ['1-800-222-1222'],
      CRISIS_HOTLINE: ['988', '1-800-273-8255']
    },
    PROCEDURES: {
      IMMEDIATE_DANGER: [
        'Move to well-lit public area immediately',
        'Call emergency services if safe to do so',
        'Share location with trusted contacts',
        'Avoid isolated areas',
        'Stay on phone with emergency operator'
      ],
      SUSPICIOUS_ACTIVITY: [
        'Do not confront suspicious individuals',
        'Move to populated area',
        'Report to authorities',
        'Document details safely',
        'Avoid sharing location publicly'
      ],
      MEDICAL_EMERGENCY: [
        'Call emergency medical services',
        'Provide clear location and symptoms',
        'Follow operator instructions',
        'Do not move injured person unless necessary',
        'Keep patient calm and warm'
      ]
    }
  },

  // Route Safety Assessment
  ROUTE_SAFETY: {
    SCORING_FACTORS: {
      LIGHTING: {
        EXCELLENT: { score: 90-100, description: 'Well-lit streets, commercial lighting' },
        GOOD: { score: 70-89, description: 'Adequate street lighting' },
        FAIR: { score: 50-69, description: 'Some lighting, dark spots present' },
        POOR: { score: 0-49, description: 'Minimal lighting, very dark areas' }
      },
      CRIME_RATE: {
        VERY_SAFE: { score: 90-100, description: 'Very low crime rate' },
        SAFE: { score: 75-89, description: 'Low crime rate' },
        MODERATE: { score: 50-74, description: 'Moderate crime rate' },
        HIGH: { score: 25-49, description: 'High crime rate' },
        VERY_HIGH: { score: 0-24, description: 'Very high crime rate' }
      },
      POPULATION_DENSITY: {
        HIGH: { description: 'High foot traffic, many witnesses', safety_boost: 15 },
        MEDIUM: { description: 'Moderate foot traffic', safety_boost: 10 },
        LOW: { description: 'Low foot traffic, isolation risk', safety_boost: -10 }
      },
      EMERGENCY_ACCESS: {
        EXCELLENT: { score: 90-100, description: 'Hospital, police, fire station nearby' },
        GOOD: { score: 70-89, description: 'Emergency services within 2 miles' },
        FAIR: { score: 50-69, description: 'Emergency services 2-5 miles away' },
        POOR: { score: 0-49, description: 'Limited emergency access' }
      }
    },
    ROUTE_TYPES: {
      SAFEST: {
        priority_factors: ['lighting', 'crime_rate', 'emergency_access', 'population_density'],
        avoid: ['unlit_streets', 'isolated_areas', 'high_crime_zones'],
        prefer: ['well_lit', 'populated', 'commercial_areas', 'emergency_nearby']
      },
      FASTEST: {
        priority_factors: ['distance', 'traffic_flow'],
        avoid: ['traffic_jams', 'construction', 'road_closures'],
        prefer: ['highways', 'main_roads', 'traffic_optimized']
      }
    }
  },

  // Personal Safety Guidelines
  PERSONAL_SAFETY: {
    PREVENTION: {
      SITUATIONAL_AWARENESS: [
        'Keep headphones volume low or use one ear',
        'Avoid phone distractions while walking',
        'Scan surroundings regularly',
        'Walk confidently and purposefully',
        'Make eye contact with people nearby'
      ],
      TECHNOLOGY: [
        'Keep phone charged above 50%',
        'Enable location sharing with trusted contacts',
        'Download offline maps for areas with poor signal',
        'Have emergency contacts easily accessible',
        'Use safety apps with SOS features'
      ],
      PLANNING: [
        'Share itinerary with friends/family',
        'Research route before travel',
        'Check weather conditions',
        'Have backup transportation planned',
        'Avoid unfamiliar areas after dark'
      ]
    },
    TRAVEL_GUIDELINES: {
      DAYTIME: [
        'Use crosswalks and obey traffic signals',
        'Walk facing traffic when no sidewalk',
        'Make eye contact with drivers',
        'Wear bright or reflective clothing',
        'Stay in well-populated areas'
      ],
      NIGHTTIME: [
        'Stick to well-lit main streets',
        'Walk with friends when possible',
        'Avoid shortcuts through alleys or parks',
        'Keep valuables hidden and secure',
        'Have keys ready before reaching door/car',
        'Use trusted ride services when available'
      ],
      PUBLIC_TRANSPORT: [
        'Wait in well-lit areas',
        'Sit near driver if possible',
        'Share ride details with contacts',
        'Verify driver and vehicle details',
        'Use official taxi/ride services'
      ]
    },
    EMERGENCY_PREPAREDNESS: {
      MUST_HAVE: [
        'Emergency contact list',
        'Medical information readily available',
        'Knowledge of nearest emergency services',
        'Portable phone charger/power bank',
        'Basic first aid supplies',
        'Flashlight or headlamp'
      ],
      COMMUNICATION_PLAN: [
        'Primary emergency contact',
        'Secondary emergency contact',
        'Out-of-state emergency contact',
        'Workplace emergency contact',
        'Medical information and allergies',
        'Blood type and medical conditions'
      ]
    }
  },

  // Community Safety Standards
  COMMUNITY_SAFETY: {
    NEIGHBORHOOD_WATCH: [
      'Report suspicious activity immediately',
      'Document important details safely',
      'Share information with neighbors',
      'Coordinate with local authorities',
      'Maintain regular communication'
    ],
    INCIDENT_REPORTING: {
      WHAT_TO_REPORT: [
        'Time and location of incident',
        'Description of individuals involved',
        'Vehicle information (if applicable)',
        'Environmental conditions',
        'Any weapons or dangerous items',
        'Injuries or medical attention needed'
      ],
      REPORTING_CHANNELS: [
        'Local police non-emergency line',
        'Community safety apps',
        'Neighborhood watch groups',
        'Local authorities',
        'Campus security (if applicable)'
      ]
    },
    SAFETY_ZONES: {
      DESIGNATED_SAFE_AREAS: [
        'Police stations',
        'Fire stations',
        'Hospitals',
        '24/7 businesses',
        'Well-lit main streets',
        'Public transportation hubs',
        'Shopping centers during business hours'
      ],
      AVOIDANCE_AREAS: [
        'Isolated parks after dark',
        'Poorly lit streets',
        'Areas with recent incidents',
        'Construction zones',
        'Unfamiliar neighborhoods at night',
        'Areas with limited cell service'
      ]
    }
  },

  // Technology Safety Standards
  TECHNOLOGY_SAFETY: {
    APP_PERMISSIONS: [
      'Location services (GPS)',
      'Camera access for documentation',
      'Microphone for voice commands',
      'Notifications for emergency alerts',
      'Contacts for emergency communication'
    ],
    DATA_PRIVACY: [
      'End-to-end encryption for communications',
      'Location data anonymization in reports',
      'User consent for data sharing',
      'Regular data deletion policies',
      'GDPR compliance for international users'
    ],
    SYSTEM_RELIABILITY: [
      '99.9% uptime for emergency services',
      'Backup systems for critical failures',
      'Redundant communication channels',
      'Offline functionality for poor connectivity',
      'Regular security updates and patches'
    ]
  },

  // Legal and Compliance Standards
  LEGAL_COMPLIANCE: {
    DUTY_OF_CARE: [
      'Reasonable care in route recommendations',
      'Warning about known safety risks',
      'Regular updates to safety information',
      'Compliance with local safety regulations',
      'User education about safety features'
    ],
    LIABILITY: [
      'Clear terms of service',
      'Limitation of liability for user actions',
      'Insurance requirements for service providers',
      'Compliance with transportation regulations',
      'Data protection and privacy policies'
    ],
    REGULATORY_COMPLIANCE: [
      'GDPR (European Union)',
      'CCPA (California)',
      'PIPEDA (Canada)',
      'Local transportation regulations',
      'Emergency service communication standards',
      'Accessibility compliance (ADA)'
    ]
  }
};

// Safety Scoring Algorithm
export const calculateSafetyScore = (factors: {
  lighting: number;
  crimeRate: number;
  populationDensity: number;
  emergencyAccess: number;
}) => {
  const weights = {
    lighting: 0.25,
    crimeRate: 0.30,
    populationDensity: 0.25,
    emergencyAccess: 0.20
  };

  const score = (
    factors.lighting * weights.lighting +
    factors.crimeRate * weights.crimeRate +
    factors.populationDensity * weights.populationDensity +
    factors.emergencyAccess * weights.emergencyAccess
  );

  return Math.min(100, Math.max(0, score));
};

// Risk Assessment Levels
export const RISK_LEVELS = {
  LOW: { threshold: 80, color: '#10b981', description: 'Low Risk' },
  MODERATE: { threshold: 60, color: '#f59e0b', description: 'Moderate Risk' },
  HIGH: { threshold: 40, color: '#f97316', description: 'High Risk' },
  CRITICAL: { threshold: 20, color: '#dc2626', description: 'Critical Risk' }
};

// Emergency Response Templates
export const EMERGENCY_TEMPLATES = {
  MEDICAL: {
    message: 'Medical emergency detected. Location: {location}. Sending help.',
    actions: ['Calling ambulance', 'Notifying emergency contacts', 'Sharing medical info']
  },
  THREAT: {
    message: 'Security threat detected. Location: {location}. Initiating safety protocols.',
    actions: ['Alerting authorities', 'Sharing location', 'Activating recording']
  },
  LOST: {
    message: 'User appears to be lost. Location: {location}. Providing assistance.',
    actions: ['Sharing location with contacts', 'Suggesting safe locations', 'Contacting help']
  }
};

export default SAFETY_PROTOCOLS;
