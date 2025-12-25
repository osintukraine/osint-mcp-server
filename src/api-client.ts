/**
 * OSINT Platform API Client
 *
 * Comprehensive HTTP client for the OSINT Intelligence Platform REST API.
 * Covers all major endpoints for messages, search, entities, events, analytics,
 * social graph, map, validation, admin stats, and system monitoring.
 */

export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  jwtToken?: string;
  // Ory Kratos/Oathkeeper authentication
  oryUserId?: string;
  oryUserEmail?: string;
  oryUserRole?: string;
}

export class OsintApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Authentication priority:
    // 1. JWT token (standalone auth)
    // 2. API Key (programmatic access) - uses Bearer auth with ak_ prefix
    // 3. Ory Kratos headers (when behind Oathkeeper proxy)
    if (config.jwtToken) {
      this.headers['Authorization'] = `Bearer ${config.jwtToken}`;
    } else if (config.apiKey) {
      // API keys use Bearer auth, same as JWT tokens
      // Keys start with ak_ prefix (e.g., ak_abc123...)
      this.headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.oryUserId) {
      // Ory Kratos/Oathkeeper authentication
      // These headers are normally injected by Oathkeeper proxy,
      // but can be set directly for MCP server access
      this.headers['X-User-ID'] = config.oryUserId;
      if (config.oryUserEmail) {
        this.headers['X-User-Email'] = config.oryUserEmail;
      }
      if (config.oryUserRole) {
        this.headers['X-User-Role'] = config.oryUserRole;
      }
    }
  }

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
  // MESSAGES
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
    media_type?: string;
    is_spam?: boolean;
    language?: string;
    min_views?: number;
    min_forwards?: number;
    channel_folder?: string;
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

  async getMessageAlbum(messageId: number) {
    return this.get(`/api/messages/${messageId}/album`);
  }

  async getMessageNetwork(messageId: number, params?: {
    include_similar?: boolean;
    similarity_threshold?: number;
    max_similar?: number;
  }) {
    return this.get(`/api/messages/${messageId}/network`, params);
  }

  async getMessageTimeline(messageId: number, params?: {
    before_count?: number;
    after_count?: number;
    same_channel_only?: boolean;
    use_semantic?: boolean;
    use_events?: boolean;
    similarity_threshold?: number;
  }) {
    return this.get(`/api/messages/${messageId}/timeline`, params);
  }

  // =============================================================================
  // SEMANTIC SEARCH
  // =============================================================================

  async semanticSearch(params: {
    q: string;
    similarity_threshold?: number;
    limit?: number;
    channel_id?: number;
    importance_level?: string;
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

  async getTags(params?: {
    tag_type?: string;
    limit?: number;
  }) {
    return this.get('/api/semantic/tags', params);
  }

  async searchByTags(params: {
    tags: string;
    match_all?: boolean;
    limit?: number;
  }) {
    return this.get('/api/semantic/tags/search', params);
  }

  // =============================================================================
  // UNIFIED SEARCH
  // =============================================================================

  async unifiedSearch(params: {
    q: string;
    mode?: 'text' | 'semantic';
    types?: string;
    limit_per_type?: number;
    days?: number;
    location?: string;
    lat?: number;
    lng?: number;
    radius_km?: number;
    bounds?: string;
  }) {
    return this.get('/api/search', params);
  }

  // =============================================================================
  // CHANNELS
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

  async getChannelNetwork(channelId: number, params?: {
    similarity_threshold?: number;
    max_messages?: number;
    time_window?: string;
    include_clusters?: boolean;
  }) {
    return this.get(`/api/channels/${channelId}/network`, params);
  }

  // =============================================================================
  // SOCIAL GRAPH
  // =============================================================================

  async getMessageSocialGraph(messageId: number, params?: {
    include_forwards?: boolean;
    include_replies?: boolean;
    max_depth?: number;
    max_comments?: number;
  }) {
    return this.get(`/api/social-graph/messages/${messageId}`, params);
  }

  async getChannelInfluence(channelId: number) {
    return this.get(`/api/social-graph/channels/${channelId}/influence`);
  }

  async getInfluenceNetwork(params?: {
    min_forwards?: number;
    days?: number;
    limit?: number;
  }) {
    return this.get('/api/social-graph/influence-network', params);
  }

  async getEngagementTimeline(messageId: number) {
    return this.get(`/api/social-graph/messages/${messageId}/engagement-timeline`);
  }

  async getMessageComments(messageId: number, params?: {
    limit?: number;
    offset?: number;
  }) {
    return this.get(`/api/social-graph/messages/${messageId}/comments`, params);
  }

  async getTopForwarded(params?: {
    days?: number;
    limit?: number;
  }) {
    return this.get('/api/social-graph/virality/top-forwarded', params);
  }

  async getTopInfluencers(params?: {
    days?: number;
    limit?: number;
  }) {
    return this.get('/api/social-graph/influencers', params);
  }

  // =============================================================================
  // ENTITIES
  // =============================================================================

  async searchEntities(params: {
    q: string;
    source?: string;
    entity_type?: string;
    limit?: number;
  }) {
    return this.get('/api/entities/search', params);
  }

  async getEntity(source: string, entityId: string, params?: {
    include_linked?: boolean;
  }) {
    return this.get(`/api/entities/${source}/${entityId}`, params);
  }

  async getEntityRelationships(source: string, entityId: string, params?: {
    refresh?: boolean;
  }) {
    return this.get(`/api/entities/${source}/${entityId}/relationships`, params);
  }

  async getEntityMessages(source: string, entityId: string, params?: {
    limit?: number;
    offset?: number;
  }) {
    return this.get(`/api/entities/${source}/${entityId}/messages`, params);
  }

  // =============================================================================
  // EVENTS / CLUSTERS
  // =============================================================================

  async listEvents(params?: {
    page?: number;
    page_size?: number;
    tab?: 'active' | 'major' | 'archived' | 'all';
    event_type?: string;
    tier_status?: string;
    search?: string;
    search_mode?: 'text' | 'semantic';
    similarity_threshold?: number;
  }) {
    return this.get('/api/events', params);
  }

  async getEventStats() {
    return this.get('/api/events/stats');
  }

  async getEvent(eventId: number, params?: {
    include_messages?: boolean;
    include_sources?: boolean;
    message_limit?: number;
  }) {
    return this.get(`/api/events/${eventId}`, params);
  }

  async getEventTimeline(eventId: number) {
    return this.get(`/api/events/${eventId}/timeline`);
  }

  async getEventsForMessage(messageId: number) {
    return this.get(`/api/events/message/${messageId}`);
  }

  // =============================================================================
  // ANALYTICS
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
    return this.get('/api/analytics/distribution/topics', params);
  }

  async getLanguageDistribution(params?: {
    days?: number;
  }) {
    return this.get('/api/analytics/distribution/languages', params);
  }

  async getChannelAnalytics(params?: {
    days?: number;
    limit?: number;
  }) {
    return this.get('/api/analytics/channels/activity', params);
  }

  async getHeatmap(params?: {
    days?: number;
  }) {
    return this.get('/api/analytics/heatmap', params);
  }

  async getEntityAnalytics(params?: {
    days?: number;
    limit?: number;
  }) {
    return this.get('/api/analytics/entities', params);
  }

  async getMediaAnalytics() {
    return this.get('/api/analytics/media');
  }

  // =============================================================================
  // MAP / GEOLOCATION
  // =============================================================================

  async getMapMessages(params?: {
    bounds?: string;
    zoom?: number;
    cluster?: boolean;
    cluster_grid_size?: number;
    days?: number;
    include_confidence?: boolean;
  }) {
    return this.get('/api/map/messages', params);
  }

  async getMapClusters(params?: {
    bounds?: string;
    zoom?: number;
    tier_status?: string;
    days?: number;
  }) {
    return this.get('/api/map/clusters', params);
  }

  async getMapEvents(params?: {
    bounds?: string;
  }) {
    return this.get('/api/map/events', params);
  }

  async getMapHeatmap(params?: {
    zoom?: number;
    bounds?: string;
    grid_size?: number;
  }) {
    return this.get('/api/map/heatmap', params);
  }

  async suggestLocations(params: {
    q: string;
    limit?: number;
  }) {
    return this.get('/api/map/locations/suggest', params);
  }

  async reverseGeocode(params: {
    lat: number;
    lng: number;
  }) {
    return this.get('/api/map/locations/reverse', params);
  }

  // =============================================================================
  // STREAM (Unified Intelligence Feed)
  // =============================================================================

  async getUnifiedStream(params?: {
    limit?: number;
    sources?: string;
    categories?: string;
    importance_level?: string;
    hours?: number;
  }) {
    return this.get('/api/stream/unified', params);
  }

  // =============================================================================
  // VALIDATION (RSS Cross-Reference)
  // =============================================================================

  async validateMessage(messageId: number) {
    return this.get(`/api/validation/messages/${messageId}`);
  }

  async getCorrelations(messageId: number) {
    return this.get(`/api/validation/messages/${messageId}/correlations`);
  }

  // =============================================================================
  // COMMENTS
  // =============================================================================

  async getComment(commentId: number) {
    return this.get(`/api/comments/${commentId}`);
  }

  async translateComment(commentId: number) {
    return this.post(`/api/comments/${commentId}/translate`);
  }

  // =============================================================================
  // MEDIA
  // =============================================================================

  async getMediaGallery(params?: {
    channel_id?: number;
    media_type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.get('/api/media/gallery', params);
  }

  // =============================================================================
  // ADMIN - READ ONLY (Stats & Monitoring)
  // =============================================================================

  async getAdminDashboard() {
    return this.get('/api/admin/dashboard');
  }

  async getAdminStatsOverview() {
    return this.get('/api/admin/stats/overview');
  }

  async getAdminStatsQuality() {
    return this.get('/api/admin/stats/quality');
  }

  async getAdminStatsProcessing(params?: {
    hours?: number;
  }) {
    return this.get('/api/admin/stats/processing', params);
  }

  async getAdminStatsStorage() {
    return this.get('/api/admin/stats/storage');
  }

  async getAdminWorkersStats() {
    return this.get('/api/admin/system/workers/stats');
  }

  async getAdminEnrichmentTasks() {
    return this.get('/api/admin/system/enrichment/tasks');
  }

  async getAdminCacheStats() {
    return this.get('/api/admin/system/cache/stats');
  }

  async getAdminAuditStats() {
    return this.get('/api/admin/system/audit/stats');
  }

  async getAdminSpamStats() {
    return this.get('/api/admin/spam/stats');
  }

  async getAdminChannelsStats() {
    return this.get('/api/admin/channels/stats');
  }

  async getAdminEntitiesStats() {
    return this.get('/api/admin/entities/stats');
  }

  async getAdminFeedsStats() {
    return this.get('/api/admin/feeds/rss/stats');
  }

  async getAdminPromptsStats() {
    return this.get('/api/admin/prompts/stats');
  }

  async getAdminCommentsStats() {
    return this.get('/api/admin/comments/stats');
  }

  async getAdminViralPosts() {
    return this.get('/api/admin/comments/viral');
  }

  // =============================================================================
  // SYSTEM HEALTH
  // =============================================================================

  async getHealth() {
    return this.get('/health');
  }

  async getHardwareConfig() {
    return this.get('/api/health/hardware');
  }

  async getSystemStatus() {
    return this.get('/api/system/status');
  }

  async getMetricsOverview() {
    return this.get('/api/metrics/overview');
  }

  async getMetricsLLM() {
    return this.get('/api/metrics/llm');
  }

  async getMetricsPipeline() {
    return this.get('/api/metrics/pipeline');
  }

  async getMetricsServices() {
    return this.get('/api/metrics/services');
  }

  // =============================================================================
  // MODELS (LLM Configuration)
  // =============================================================================

  async listModels() {
    return this.get('/api/models');
  }

  async getModelHealth() {
    return this.get('/api/models/health');
  }
}
