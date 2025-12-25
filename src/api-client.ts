/**
 * OSINT Platform API Client
 *
 * HTTP client for communicating with the OSINT Intelligence Platform REST API.
 * Supports JWT authentication, API keys, and anonymous access.
 */

export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  jwtToken?: string;
}

export class OsintApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add authentication if provided
    if (config.jwtToken) {
      this.headers['Authorization'] = `Bearer ${config.jwtToken}`;
    } else if (config.apiKey) {
      this.headers['X-API-Key'] = config.apiKey;
    }
  }

  /**
   * Make a GET request to the API
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make a POST request to the API
   */
  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    return response.json() as Promise<T>;
  }

  // =============================================================================
  // Messages
  // =============================================================================

  async searchMessages(params: {
    q?: string;
    channel_id?: number;
    days?: number;
    date_from?: string;
    date_to?: string;
    importance_level?: string;
    topic?: string;
    has_media?: boolean;
    is_spam?: boolean;
    page?: number;
    page_size?: number;
  }) {
    return this.get('/api/messages', params);
  }

  async getMessage(messageId: number) {
    return this.get(`/api/messages/${messageId}`);
  }

  async getAdjacentMessages(messageId: number) {
    return this.get(`/api/messages/${messageId}/adjacent`);
  }

  // =============================================================================
  // Semantic Search
  // =============================================================================

  async semanticSearch(params: {
    q: string;
    similarity_threshold?: number;
    limit?: number;
    channel_id?: number;
    days?: number;
  }) {
    return this.get('/api/semantic/search', params);
  }

  async findSimilarMessages(messageId: number, params?: {
    similarity_threshold?: number;
    limit?: number;
  }) {
    return this.get(`/api/semantic/similar/${messageId}`, params);
  }

  // =============================================================================
  // Unified Search
  // =============================================================================

  async unifiedSearch(params: {
    q: string;
    mode?: 'text' | 'semantic';
    types?: string;
    limit_per_type?: number;
    days?: number;
  }) {
    return this.get('/api/search', params);
  }

  // =============================================================================
  // Channels
  // =============================================================================

  async listChannels(params?: {
    active_only?: boolean;
    rule?: string;
    folder?: string;
    verified_only?: boolean;
    limit?: number;
  }) {
    return this.get('/api/channels', params);
  }

  async getChannel(channelId: number) {
    return this.get(`/api/channels/${channelId}`);
  }

  async getChannelStats(channelId: number) {
    return this.get(`/api/channels/${channelId}/stats`);
  }

  // =============================================================================
  // Entities
  // =============================================================================

  async searchEntities(params: {
    q: string;
    source?: string;
    entity_type?: string;
    limit?: number;
  }) {
    return this.get('/api/entities/search', params);
  }

  async getEntity(entityId: string) {
    return this.get(`/api/entities/${entityId}`);
  }

  async getEntityRelationships(entityId: string) {
    return this.get(`/api/entities/${entityId}/relationships`);
  }

  async getEntityLinkedMessages(entityId: string, params?: {
    limit?: number;
    offset?: number;
  }) {
    return this.get(`/api/entities/${entityId}/messages`, params);
  }

  // =============================================================================
  // Events/Clusters
  // =============================================================================

  async listEvents(params?: {
    tier?: string;
    days?: number;
    location?: string;
    limit?: number;
  }) {
    return this.get('/api/events', params);
  }

  async getEvent(eventId: number) {
    return this.get(`/api/events/${eventId}`);
  }

  async getEventMessages(eventId: number) {
    return this.get(`/api/events/${eventId}/messages`);
  }

  // =============================================================================
  // Analytics
  // =============================================================================

  async getTimelineStats(params?: {
    granularity?: 'hour' | 'day' | 'week' | 'month' | 'year';
    channel_id?: number;
    topic?: string;
    importance_level?: string;
    date_from?: string;
    date_to?: string;
    days?: number;
  }) {
    return this.get('/api/analytics/timeline', params);
  }

  async getTopicDistribution(params?: {
    days?: number;
    limit?: number;
  }) {
    return this.get('/api/analytics/topics', params);
  }

  async getChannelAnalytics(params?: {
    days?: number;
    limit?: number;
  }) {
    return this.get('/api/analytics/channels', params);
  }

  // =============================================================================
  // Social Graph
  // =============================================================================

  async getMessageSocialGraph(messageId: number) {
    return this.get(`/api/messages/${messageId}/social-graph`);
  }

  async getChannelNetwork(channelId: number, params?: {
    depth?: number;
  }) {
    return this.get(`/api/channels/${channelId}/network`, params);
  }

  // =============================================================================
  // Map/Geo
  // =============================================================================

  async getMapMessages(params?: {
    bbox?: string;
    days?: number;
    zoom?: number;
  }) {
    return this.get('/api/map/messages', params);
  }

  async getMapClusters(params?: {
    bbox?: string;
    tier?: string;
    days?: number;
  }) {
    return this.get('/api/map/clusters', params);
  }

  // =============================================================================
  // System
  // =============================================================================

  async getHealth() {
    return this.get('/health');
  }

  async getSystemStatus() {
    return this.get('/api/system/status');
  }
}
