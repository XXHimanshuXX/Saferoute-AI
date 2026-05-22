import { AIRequest, AIResponseData, ChatContext, Incident, Location } from '../types';

export class AIService {
  private static instance: AIService;
  
  // Simulated AI responses for development
  private static readonly responses = {
    general_inquiry: [
      "I'm here to help with your safety concerns. How can I assist you today?",
      "I can provide safety information, route planning, and emergency assistance. What do you need?",
      "Hello! I'm your AI safety assistant. Ask me about routes, incidents, or safety tips."
    ],
    safety_inquiry: [
      "Based on current location data, this area has a **safety score of 78%**. I recommend staying on well-lit main streets.",
      "This location shows **moderate safety levels**. Recent reports indicate good lighting during evening hours.",
      "Safety analysis complete: **low crime rate** but **poor lighting** in some areas. Stick to main roads."
    ],
    route_request: [
      "I can help you find the safest route! I'll analyze multiple options considering lighting, traffic, and recent incident data.",
      "Calculating optimal route now. I'm checking for well-lit paths and areas with high foot traffic.",
      "Route analysis in progress. I'll prioritize safety over speed based on your preferences."
    ],
    emergency: [
      "**EMERGENCY ASSISTANCE ACTIVATED**. I'm sharing your location with emergency services and your designated contacts.",
      "**SOS MODE ENABLED**. Your location has been broadcast to nearby users and emergency services.",
      "**EMERGENCY PROTOCOL INITIATED**. Stay calm and provide any additional details about your situation."
    ],
    location_inquiry: [
      "I can help with location-based safety information. Are you looking for nearby emergency services or current conditions?",
      "Checking safety data for your current area. I can provide information about nearby safe zones and services.",
      "Location-based analysis complete. I have data on emergency services, safe areas, and recent incidents nearby."
    ],
    lighting: [
      "Lighting analysis shows **good coverage** on main streets, but **poor lighting** in side alleys.",
      "Current lighting conditions: **adequate** on commercial streets, **limited** in residential areas.",
      "Lighting data indicates **well-lit main roads** but **dark spots** between blocks."
    ],
    crime: [
      "Recent crime data shows **low activity** in this area with mostly minor incidents reported.",
      "Crime analysis indicates **moderate risk**. Most incidents are non-violent and occur during late hours.",
      "Safety check complete: **below average crime rate** for this neighborhood."
    ]
  };

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public async generateResponse(request: AIRequest): Promise<AIResponseData> {
    const startTime = Date.now();
    
    // Simulate AI processing time
    await this.simulateProcessingTime();
    
    const responseTime = Date.now() - startTime;
    const message = request.message.toLowerCase();
    
    // Analyze intent and extract entities
    const { intent, entities, confidence } = this.analyzeMessage(message);
    
    // Generate contextual response
    const response = await this.generateContextualResponse(intent, entities, request.context);
    
    return {
      text: response.text,
      confidence: confidence,
      intent: intent,
      entities: entities,
      suggestions: response.suggestions,
      responseTime
    };
  }

  public async analyzeSafetyForLocation(location: Location): Promise<{
    safetyScore: number;
    factors: {
      lighting: number;
      crime: number;
      population: number;
      emergencyServices: number;
    };
    recommendations: string[];
  }> {
    // Simulate location-based safety analysis
    await this.simulateProcessingTime();
    
    const safetyScore = 65 + Math.random() * 30; // 65-95
    
    return {
      safetyScore: Math.round(safetyScore),
      factors: {
        lighting: 70 + Math.random() * 25,
        crime: 10 + Math.random() * 20,
        population: 50 + Math.random() * 40,
        emergencyServices: 75 + Math.random() * 20
      },
      recommendations: [
        "Stay on well-lit main streets",
        "Avoid shortcuts through unlit areas",
        "Keep phone charged and share location",
        "Travel during high-traffic hours when possible"
      ]
    };
  }

  public async generateRouteAnalysis(start: Location, end: Location): Promise<{
    safestRoute: any;
    fastestRoute: any;
    recommendation: string;
  }> {
    await this.simulateProcessingTime();
    
    // Simulate route analysis
    const distance = this.calculateDistance(start, end);
    
    return {
      safestRoute: {
        distance: distance * 1.2,
        time: distance * 15, // 15 min per km
        safetyScore: 85 + Math.random() * 10,
        lighting: 'good',
        traffic: 'low'
      },
      fastestRoute: {
        distance: distance,
        time: distance * 12, // 12 min per km
        safetyScore: 65 + Math.random() * 15,
        lighting: 'fair',
        traffic: 'medium'
      },
      recommendation: "I recommend the safest route as it has better lighting and lower incident reports."
    };
  }

  private analyzeMessage(message: string): {
    intent: string;
    entities: any[];
    confidence: number;
  } {
    const entities: any[] = [];
    let intent = 'general_inquiry';
    let confidence = 0.7;

    // Extract entities and determine intent
    if (message.includes('safe') || message.includes('dangerous')) {
      intent = 'safety_inquiry';
      confidence = 0.85;
      entities.push({ type: 'safety_concern', value: 'area_safety', confidence: 0.9 });
    }
    
    if (message.includes('route') || message.includes('direction') || message.includes('navigate')) {
      intent = 'route_request';
      confidence = 0.9;
      entities.push({ type: 'navigation', value: 'route_planning', confidence: 0.85 });
    }
    
    if (message.includes('emergency') || message.includes('help') || message.includes('sos')) {
      intent = 'emergency';
      confidence = 0.95;
      entities.push({ type: 'emergency', value: 'immediate_danger', confidence: 0.95 });
    }
    
    if (message.includes('where') || message.includes('location') || message.includes('nearby')) {
      intent = 'location_inquiry';
      confidence = 0.8;
      entities.push({ type: 'location', value: 'nearby_services', confidence: 0.8 });
    }
    
    if (message.includes('light') || message.includes('dark') || message.includes('streetlight')) {
      intent = 'lighting';
      confidence = 0.85;
      entities.push({ type: 'infrastructure', value: 'lighting_conditions', confidence: 0.85 });
    }
    
    if (message.includes('crime') || message.includes('incident') || message.includes('theft')) {
      intent = 'crime';
      confidence = 0.85;
      entities.push({ type: 'safety', value: 'crime_data', confidence: 0.85 });
    }

    return { intent, entities, confidence };
  }

  private async generateContextualResponse(
    intent: string, 
    entities: any[], 
    context?: ChatContext
  ): Promise<{ text: string; suggestions: string[] }> {
    
    const responsePool = AIService.responses[intent as keyof typeof AIService.responses] || AIService.responses.general_inquiry;
    const baseResponse = responsePool[Math.floor(Math.random() * responsePool.length)];
    
    let suggestions: string[] = [];
    
    // Generate contextual suggestions based on intent
    switch (intent) {
      case 'safety_inquiry':
        suggestions = ['Show safest route', 'Find nearby police stations', 'Check lighting conditions'];
        break;
      case 'route_request':
        suggestions = ['Plan safest route', 'Check traffic conditions', 'Find emergency services along route'];
        break;
      case 'emergency':
        suggestions = ['Call emergency services', 'Share location with contacts', 'Activate SOS mode'];
        break;
      case 'location_inquiry':
        suggestions = ['Find nearest police station', 'Locate hospitals', 'Check safe areas nearby'];
        break;
      case 'lighting':
        suggestions = ['Report lighting issue', 'Find well-lit alternatives', 'Check streetlight status'];
        break;
      case 'crime':
        suggestions = ['Report suspicious activity', 'View recent incidents', 'Check crime statistics'];
        break;
      default:
        suggestions = ['Get safety advice', 'Report incident', 'Plan safe route'];
    }
    
    // Add context-aware modifications
    if (context?.emergencyMode) {
      return {
        text: "**EMERGENCY MODE ACTIVE**. " + baseResponse + " I'm prioritizing your safety and can connect you with emergency services immediately.",
        suggestions: ['Call 911', 'Share emergency location', 'Contact emergency contacts']
      };
    }
    
    if (context?.currentLocation) {
      return {
        text: baseResponse + ` Based on your current location, I can provide specific safety information for this area.`,
        suggestions
      };
    }
    
    return { text: baseResponse, suggestions };
  }

  private calculateDistance(start: Location, end: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = (end.coordinates.lat - start.coordinates.lat) * Math.PI / 180;
    const dLon = (end.coordinates.lng - start.coordinates.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(start.coordinates.lat * Math.PI / 180) * Math.cos(end.coordinates.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private async simulateProcessingTime(): Promise<void> {
    // Simulate AI processing time (500ms to 2s)
    const processingTime = 500 + Math.random() * 1500;
    return new Promise(resolve => setTimeout(resolve, processingTime));
  }

  // In production, this would integrate with real AI services
  private async callRealAI(prompt: string): Promise<string> {
    // Integration with OpenAI, Gemini, or other AI services
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    //   body: JSON.stringify({
    //     model: 'gpt-4',
    //     messages: [{ role: 'user', content: prompt }]
    //   })
    // });
    // return response.choices[0].message.content;
    
    // For now, return simulated response
    return "AI service integration coming soon!";
  }
}

export default AIService.getInstance();
