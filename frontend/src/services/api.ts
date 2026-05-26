// API Service for SafeRoute AI Frontend Integration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  token?: string;
}

export interface RouteRequest {
  start: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  end: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  routeType?: 'fastest' | 'safest';
}

export interface SafetyIncident {
  id: string;
  type: string;
  severity: number;
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  description: string;
  timestamp: string;
}

export interface EmergencyAlert {
  id: string;
  type: string;
  severity: string;
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  description: string;
  status: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'ai';
  timestamp: string;
  suggestions?: string[];
}

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('saferoute_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('saferoute_token', token);
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  // Authentication APIs
  async register(userData: { username: string; email: string; password: string }): Promise<ApiResponse<User>> {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async login(credentials: { email: string; password: string }): Promise<ApiResponse<User>> {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await this.request('/api/auth/profile');
    return response.json();
  }

  // Route APIs
  async calculateRoute(routeData: RouteRequest): Promise<ApiResponse<any>> {
    const response = await this.request('/api/routes/calculate', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
    return response.json();
  }

  async getMyRoutes(): Promise<ApiResponse<any[]>> {
    const response = await this.request('/api/routes/my-routes');
    return response.json();
  }

  // Safety APIs
  async reportIncident(incidentData: any): Promise<ApiResponse<SafetyIncident>> {
    const response = await this.request('/api/safety/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
    return response.json();
  }

  async getNearbyIncidents(lat: number, lng: number): Promise<ApiResponse<SafetyIncident[]>> {
    const response = await this.request(`/api/safety/incidents/nearby/${lat}/${lng}`);
    return response.json();
  }

  async getSafetyStatistics(lat: number, lng: number): Promise<ApiResponse<any>> {
    const response = await this.request(`/api/safety/statistics/${lat}/${lng}`);
    return response.json();
  }

  async getSafetyHeatmap(lat: number, lng: number): Promise<ApiResponse<any>> {
    const response = await this.request(`/api/safety/heatmap/${lat}/${lng}`);
    return response.json();
  }

  // Emergency APIs
  async createEmergencyAlert(alertData: any): Promise<ApiResponse<EmergencyAlert>> {
    const response = await this.request('/api/emergency/alert', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
    return response.json();
  }

  async getActiveAlerts(): Promise<ApiResponse<EmergencyAlert[]>> {
    const response = await this.request('/api/emergency/active');
    return response.json();
  }

  // Chat APIs
  async createChatSession(): Promise<ApiResponse<any>> {
    const response = await this.request('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Chat Session' }),
    });
    return response.json();
  }

  async getChatSessions(): Promise<ApiResponse<any[]>> {
    const response = await this.request('/api/chat/sessions');
    return response.json();
  }

  async sendMessage(sessionId: string, message: string): Promise<ApiResponse<ChatMessage>> {
    const response = await this.request(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return response.json();
  }

  async getChatMessages(sessionId: string): Promise<ApiResponse<ChatMessage[]>> {
    const response = await this.request(`/api/chat/sessions/${sessionId}/messages`);
    return response.json();
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<any>> {
    const response = await this.request('/health');
    return response.json();
  }
}

export default new ApiService();
