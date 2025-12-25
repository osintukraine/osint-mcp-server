#!/usr/bin/env node

/**
 * OSINT Intelligence Platform MCP Server
 *
 * Comprehensive MCP server providing 60+ tools for Claude to interact with
 * the OSINT Intelligence Platform API. Covers:
 *
 * - Message search, retrieval, and analysis
 * - Semantic (AI-powered) search with pgvector
 * - Channel management and network analysis
 * - Entity lookup (OpenSanctions, Wikidata, curated)
 * - Event/cluster detection and timeline
 * - Social graph and influence analysis
 * - Geolocation and map data
 * - RSS validation and cross-referencing
 * - Platform analytics and monitoring
 * - Admin stats and system health
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { OsintApiClient } from './api-client.js';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = process.env.OSINT_API_URL || 'http://localhost:8000';
const API_KEY = process.env.OSINT_API_KEY;
const JWT_TOKEN = process.env.OSINT_JWT_TOKEN;

const apiClient = new OsintApiClient({
  baseUrl: API_BASE_URL,
  apiKey: API_KEY,
  jwtToken: JWT_TOKEN,
});

// =============================================================================
// Tool Definitions - Organized by Category
// =============================================================================

const tools: Tool[] = [
  // ===========================================================================
  // MESSAGE TOOLS
  // ===========================================================================
  {
    name: 'search_messages',
    description:
      'Search Telegram messages with full-text search and 15+ filters. ' +
      'Supports filtering by channel, date, importance (high/medium/low), topic, ' +
      'media type, language, minimum views/forwards, and channel folder.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query text (full-text search)' },
        channel_id: { type: 'number', description: 'Filter by specific channel ID' },
        days: { type: 'number', description: 'Limit to last N days' },
        date_from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        date_to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        importance_level: { type: 'string', enum: ['high', 'medium', 'low'], description: 'AI-assigned importance' },
        topic: { type: 'string', description: 'Topic filter (combat, equipment, casualties, infrastructure, humanitarian, diplomatic, etc.)' },
        has_media: { type: 'boolean', description: 'Messages with media attachments' },
        media_type: { type: 'string', enum: ['photo', 'video', 'document'], description: 'Specific media type' },
        language: { type: 'string', description: 'Language code (uk, ru, en)' },
        min_views: { type: 'number', description: 'Minimum view count' },
        min_forwards: { type: 'number', description: 'Minimum forward count' },
        channel_folder: { type: 'string', description: 'Filter by Telegram folder (e.g., Archive-UA, Archive-RU)' },
        page: { type: 'number', description: 'Page number (default: 1)' },
        page_size: { type: 'number', description: 'Results per page (default: 20, max: 100)' },
      },
    },
  },
  {
    name: 'get_message',
    description: 'Get detailed message by ID with full enrichment: content, media, AI tags, entities, locations, social graph data.',
    inputSchema: {
      type: 'object',
      properties: { message_id: { type: 'number', description: 'Message database ID' } },
      required: ['message_id'],
    },
  },
  {
    name: 'get_message_album',
    description: 'Get media album for a message (grouped photos/videos for lightbox display).',
    inputSchema: {
      type: 'object',
      properties: { message_id: { type: 'number', description: 'Message database ID' } },
      required: ['message_id'],
    },
  },
  {
    name: 'get_message_network',
    description: 'Get entity relationship graph for a message - locations, persons, organizations, military units, AI tags. Flowsint-compatible visualization.',
    inputSchema: {
      type: 'object',
      properties: {
        message_id: { type: 'number', description: 'Message database ID' },
        include_similar: { type: 'boolean', description: 'Include similar messages in graph' },
        similarity_threshold: { type: 'number', description: 'Similarity threshold (0-1)' },
        max_similar: { type: 'number', description: 'Max similar messages to include' },
      },
      required: ['message_id'],
    },
  },
  {
    name: 'get_message_timeline',
    description: 'Get temporal context for a message - messages before/after, semantically similar, or from same event cluster.',
    inputSchema: {
      type: 'object',
      properties: {
        message_id: { type: 'number', description: 'Message database ID' },
        before_count: { type: 'number', description: 'Messages before (default: 5)' },
        after_count: { type: 'number', description: 'Messages after (default: 5)' },
        same_channel_only: { type: 'boolean', description: 'Limit to same channel' },
        use_semantic: { type: 'boolean', description: 'Use semantic similarity for timeline' },
        use_events: { type: 'boolean', description: 'Use event clusters for timeline' },
      },
      required: ['message_id'],
    },
  },

  // ===========================================================================
  // SEMANTIC SEARCH TOOLS
  // ===========================================================================
  {
    name: 'semantic_search',
    description: 'AI-powered semantic search using 384-dim vector embeddings. Find messages by meaning, not just keywords.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query' },
        similarity_threshold: { type: 'number', description: 'Min similarity (0-1, default: 0.7)' },
        limit: { type: 'number', description: 'Max results (default: 10)' },
        channel_id: { type: 'number', description: 'Limit to specific channel' },
        importance_level: { type: 'string', enum: ['high', 'medium', 'low'] },
        days: { type: 'number', description: 'Limit to last N days' },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_similar_messages',
    description: 'Find messages similar to a given message using AI embeddings. Useful for tracking narratives.',
    inputSchema: {
      type: 'object',
      properties: {
        message_id: { type: 'number', description: 'Source message ID' },
        similarity_threshold: { type: 'number', description: 'Min similarity (0-1)' },
        limit: { type: 'number', description: 'Max results' },
      },
      required: ['message_id'],
    },
  },
  {
    name: 'get_tags',
    description: 'Get popular AI-generated tags ranked by frequency. Tags include keywords, topics, entities, emotions, urgency.',
    inputSchema: {
      type: 'object',
      properties: {
        tag_type: { type: 'string', description: 'Filter by tag type' },
        limit: { type: 'number', description: 'Max tags to return' },
      },
    },
  },
  {
    name: 'search_by_tags',
    description: 'Search messages by AI tags with AND/OR logic.',
    inputSchema: {
      type: 'object',
      properties: {
        tags: { type: 'string', description: 'Comma-separated tags' },
        match_all: { type: 'boolean', description: 'Require all tags (AND) vs any tag (OR)' },
        limit: { type: 'number', description: 'Max results' },
      },
      required: ['tags'],
    },
  },

  // ===========================================================================
  // UNIFIED SEARCH
  // ===========================================================================
  {
    name: 'unified_search',
    description: 'Search across ALL data sources: Telegram messages, events, RSS articles, and entities. Supports text and semantic modes.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        mode: { type: 'string', enum: ['text', 'semantic'], description: 'Search mode' },
        types: { type: 'string', description: 'Types to search: messages,events,rss,entities' },
        limit_per_type: { type: 'number', description: 'Max results per type (default: 5)' },
        days: { type: 'number', description: 'Limit to last N days' },
        location: { type: 'string', description: 'Location name filter' },
        lat: { type: 'number', description: 'Latitude for radius search' },
        lng: { type: 'number', description: 'Longitude for radius search' },
        radius_km: { type: 'number', description: 'Search radius in km' },
      },
      required: ['query'],
    },
  },

  // ===========================================================================
  // CHANNEL TOOLS
  // ===========================================================================
  {
    name: 'list_channels',
    description: 'List monitored Telegram channels. Filter by rule (archive_all, selective_archive), folder, verified status.',
    inputSchema: {
      type: 'object',
      properties: {
        active_only: { type: 'boolean', description: 'Only active channels (default: true)' },
        rule: { type: 'string', enum: ['archive_all', 'selective_archive', 'test', 'staging'] },
        folder: { type: 'string', description: 'Filter by folder name' },
        verified_only: { type: 'boolean', description: 'Only verified channels' },
        limit: { type: 'number', description: 'Max channels (default: 100)' },
      },
    },
  },
  {
    name: 'get_channel',
    description: 'Get detailed channel information including metadata, affiliation, and timestamps.',
    inputSchema: {
      type: 'object',
      properties: { channel_id: { type: 'number', description: 'Channel ID' } },
      required: ['channel_id'],
    },
  },
  {
    name: 'get_channel_stats',
    description: 'Get channel statistics: message counts, spam rate, importance distribution, topic breakdown.',
    inputSchema: {
      type: 'object',
      properties: { channel_id: { type: 'number', description: 'Channel ID' } },
      required: ['channel_id'],
    },
  },
  {
    name: 'get_channel_network',
    description: 'Build content network graph for a channel - semantic relationships, topic clusters, hub nodes.',
    inputSchema: {
      type: 'object',
      properties: {
        channel_id: { type: 'number', description: 'Channel ID' },
        similarity_threshold: { type: 'number', description: 'Min similarity for edges' },
        max_messages: { type: 'number', description: 'Max messages to analyze' },
        time_window: { type: 'string', description: 'Time window: 7d, 30d, 90d, all' },
        include_clusters: { type: 'boolean', description: 'Include K-means topic clusters' },
      },
      required: ['channel_id'],
    },
  },

  // ===========================================================================
  // SOCIAL GRAPH TOOLS
  // ===========================================================================
  {
    name: 'get_message_social_graph',
    description: 'Get complete social context: author, forwards, replies, comments, reactions, engagement metrics, virality.',
    inputSchema: {
      type: 'object',
      properties: {
        message_id: { type: 'number', description: 'Message ID' },
        include_forwards: { type: 'boolean', description: 'Include forward chain' },
        include_replies: { type: 'boolean', description: 'Include reply thread' },
        max_depth: { type: 'number', description: 'Forward chain depth' },
        max_comments: { type: 'number', description: 'Max comments to include' },
      },
      required: ['message_id'],
    },
  },
  {
    name: 'get_channel_influence',
    description: 'Get channel-to-channel forward relationships with coordination detection.',
    inputSchema: {
      type: 'object',
      properties: { channel_id: { type: 'number', description: 'Channel ID' } },
      required: ['channel_id'],
    },
  },
  {
    name: 'get_influence_network',
    description: 'Get platform-wide influence network - channels that forward to each other.',
    inputSchema: {
      type: 'object',
      properties: {
        min_forwards: { type: 'number', description: 'Minimum forwards for edge' },
        days: { type: 'number', description: 'Time window in days' },
        limit: { type: 'number', description: 'Max nodes' },
      },
    },
  },
  {
    name: 'get_engagement_timeline',
    description: 'Get engagement metrics over time for a message (views, forwards, reactions with deltas).',
    inputSchema: {
      type: 'object',
      properties: { message_id: { type: 'number', description: 'Message ID' } },
      required: ['message_id'],
    },
  },
  {
    name: 'get_message_comments',
    description: 'Get comment thread from linked discussion group.',
    inputSchema: {
      type: 'object',
      properties: {
        message_id: { type: 'number', description: 'Message ID' },
        limit: { type: 'number', description: 'Max comments' },
        offset: { type: 'number', description: 'Pagination offset' },
      },
      required: ['message_id'],
    },
  },
  {
    name: 'get_top_forwarded',
    description: 'Get viral content leaderboard - most forwarded messages.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Time window in days' },
        limit: { type: 'number', description: 'Max results' },
      },
    },
  },
  {
    name: 'get_top_influencers',
    description: 'Get top influencer profiles with interaction metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Time window' },
        limit: { type: 'number', description: 'Max results' },
      },
    },
  },

  // ===========================================================================
  // ENTITY TOOLS
  // ===========================================================================
  {
    name: 'search_entities',
    description: 'Search entities (people, orgs, equipment, military units). Sources: curated (1,425+) and OpenSanctions (10,000+).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Entity name or partial name' },
        source: { type: 'string', enum: ['curated', 'opensanctions', 'all'], description: 'Entity source' },
        entity_type: { type: 'string', description: 'Type: person, organization, military_unit, equipment, ship, aircraft, etc.' },
        limit: { type: 'number', description: 'Max results' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_entity',
    description: 'Get entity profile with metadata, aliases, and linked content counts.',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source: curated or opensanctions' },
        entity_id: { type: 'string', description: 'Entity ID (e.g., Q12345 for Wikidata)' },
        include_linked: { type: 'boolean', description: 'Include linked message/event counts' },
      },
      required: ['source', 'entity_id'],
    },
  },
  {
    name: 'get_entity_relationships',
    description: 'Get entity relationships from Wikidata SPARQL - corporate connections, political positions, associates.',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source' },
        entity_id: { type: 'string', description: 'Entity ID' },
        refresh: { type: 'boolean', description: 'Force refresh from Wikidata (bypasses 7-day cache)' },
      },
      required: ['source', 'entity_id'],
    },
  },
  {
    name: 'get_entity_mentions',
    description: 'Get messages that mention a specific entity.',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source' },
        entity_id: { type: 'string', description: 'Entity ID' },
        limit: { type: 'number', description: 'Max messages' },
      },
      required: ['source', 'entity_id'],
    },
  },

  // ===========================================================================
  // EVENT / CLUSTER TOOLS
  // ===========================================================================
  {
    name: 'list_events',
    description: 'List detected events (message clusters). Filter by tier: rumor, unconfirmed, confirmed, verified.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        page_size: { type: 'number', description: 'Results per page' },
        tab: { type: 'string', enum: ['active', 'major', 'archived', 'all'], description: 'Event tab' },
        tier_status: { type: 'string', enum: ['rumor', 'unconfirmed', 'confirmed', 'verified'], description: 'Verification tier' },
        event_type: { type: 'string', description: 'Event type filter' },
        search: { type: 'string', description: 'Search query' },
        search_mode: { type: 'string', enum: ['text', 'semantic'], description: 'Search mode' },
      },
    },
  },
  {
    name: 'get_event_stats',
    description: 'Get event statistics - counts by tier, type, and status.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_event',
    description: 'Get event details with contributing channels, messages, and RSS sources.',
    inputSchema: {
      type: 'object',
      properties: {
        event_id: { type: 'number', description: 'Event cluster ID' },
        include_messages: { type: 'boolean', description: 'Include message list' },
        include_sources: { type: 'boolean', description: 'Include RSS sources' },
        message_limit: { type: 'number', description: 'Max messages to include' },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'get_event_timeline',
    description: 'Get chronological timeline combining RSS articles and Telegram messages for an event.',
    inputSchema: {
      type: 'object',
      properties: { event_id: { type: 'number', description: 'Event ID' } },
      required: ['event_id'],
    },
  },
  {
    name: 'get_events_for_message',
    description: 'Get events linked to a specific message.',
    inputSchema: {
      type: 'object',
      properties: { message_id: { type: 'number', description: 'Message ID' } },
      required: ['message_id'],
    },
  },

  // ===========================================================================
  // ANALYTICS TOOLS
  // ===========================================================================
  {
    name: 'get_timeline_stats',
    description: 'Get message volume over time. Supports hour/day/week/month/year granularity.',
    inputSchema: {
      type: 'object',
      properties: {
        granularity: { type: 'string', enum: ['hour', 'day', 'week', 'month', 'year'] },
        channel_id: { type: 'number', description: 'Filter by channel' },
        topic: { type: 'string', description: 'Filter by topic' },
        importance_level: { type: 'string', enum: ['high', 'medium', 'low'] },
        days: { type: 'number', description: 'Time window' },
      },
    },
  },
  {
    name: 'get_topic_distribution',
    description: 'Get distribution of messages across topics.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_language_distribution',
    description: 'Get language distribution of messages.',
    inputSchema: {
      type: 'object',
      properties: { days: { type: 'number' } },
    },
  },
  {
    name: 'get_channel_analytics',
    description: 'Get per-channel performance metrics with daily breakdowns.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_activity_heatmap',
    description: 'Get daily message activity for calendar heatmap visualization.',
    inputSchema: {
      type: 'object',
      properties: { days: { type: 'number' } },
    },
  },
  {
    name: 'get_entity_analytics',
    description: 'Get entity mention analytics - most mentioned entities over time.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_media_analytics',
    description: 'Get media archival statistics with deduplication metrics.',
    inputSchema: { type: 'object', properties: {} },
  },

  // ===========================================================================
  // MAP / GEOLOCATION TOOLS
  // ===========================================================================
  {
    name: 'get_map_messages',
    description: 'Get geolocated messages as GeoJSON. Supports server-side clustering and bounding box filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        bounds: { type: 'string', description: 'Bounding box: minLng,minLat,maxLng,maxLat' },
        zoom: { type: 'number', description: 'Map zoom level (affects clustering)' },
        cluster: { type: 'boolean', description: 'Enable server-side clustering' },
        cluster_grid_size: { type: 'number', description: 'Cluster grid size' },
        days: { type: 'number', description: 'Time window' },
        include_confidence: { type: 'boolean', description: 'Include confidence scores' },
      },
    },
  },
  {
    name: 'get_map_clusters',
    description: 'Get event clusters with geographic locations by verification tier.',
    inputSchema: {
      type: 'object',
      properties: {
        bounds: { type: 'string', description: 'Bounding box' },
        tier_status: { type: 'string', enum: ['rumor', 'unconfirmed', 'confirmed', 'verified'] },
        days: { type: 'number' },
      },
    },
  },
  {
    name: 'get_map_events',
    description: 'Get confirmed events only for map display.',
    inputSchema: {
      type: 'object',
      properties: { bounds: { type: 'string', description: 'Bounding box' } },
    },
  },
  {
    name: 'get_map_heatmap',
    description: 'Get density aggregation for heatmap visualization.',
    inputSchema: {
      type: 'object',
      properties: {
        zoom: { type: 'number' },
        bounds: { type: 'string' },
        grid_size: { type: 'number' },
      },
    },
  },
  {
    name: 'suggest_locations',
    description: 'Location name autocomplete from 30,000+ UA/RU locations in GeoNames gazetteer.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Location name prefix' },
        limit: { type: 'number', description: 'Max suggestions' },
      },
      required: ['query'],
    },
  },
  {
    name: 'reverse_geocode',
    description: 'Find nearest location to coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude' },
        lng: { type: 'number', description: 'Longitude' },
      },
      required: ['lat', 'lng'],
    },
  },

  // ===========================================================================
  // STREAM TOOLS
  // ===========================================================================
  {
    name: 'get_unified_stream',
    description: 'Get unified intelligence feed combining Telegram messages and RSS articles.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max items' },
        sources: { type: 'string', description: 'Filter by sources' },
        categories: { type: 'string', description: 'RSS categories filter' },
        importance_level: { type: 'string', enum: ['high', 'medium', 'low'] },
        hours: { type: 'number', description: 'Time window in hours (1-168)' },
      },
    },
  },

  // ===========================================================================
  // VALIDATION TOOLS (RSS Cross-Reference)
  // ===========================================================================
  {
    name: 'validate_message',
    description: 'Cross-reference a Telegram message with RSS news articles. Returns validation status: confirms, contradicts, context, alternative.',
    inputSchema: {
      type: 'object',
      properties: { message_id: { type: 'number', description: 'Message ID to validate' } },
      required: ['message_id'],
    },
  },
  {
    name: 'get_message_correlations',
    description: 'Get RSS articles correlated with a message - grouped by same_event, related, alternative_viewpoints.',
    inputSchema: {
      type: 'object',
      properties: { message_id: { type: 'number', description: 'Message ID' } },
      required: ['message_id'],
    },
  },

  // ===========================================================================
  // MEDIA TOOLS
  // ===========================================================================
  {
    name: 'get_media_gallery',
    description: 'Browse media gallery with filters by channel, type, date, and importance.',
    inputSchema: {
      type: 'object',
      properties: {
        channel_id: { type: 'number' },
        media_type: { type: 'string', enum: ['photo', 'video', 'document'] },
        date_from: { type: 'string' },
        date_to: { type: 'string' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  },

  // ===========================================================================
  // ADMIN STATS TOOLS (Read-Only)
  // ===========================================================================
  {
    name: 'get_platform_dashboard',
    description: 'Get platform overview: message counts, channels, entities, storage, spam rate, LLM metrics.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_platform_stats_overview',
    description: 'Get comprehensive platform stats: pipeline health, LLM performance, totals, service health. Cached 30s.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_data_quality_stats',
    description: 'Get data quality metrics: translation coverage, embedding coverage, classification rate, media archive rate, geolocation coverage.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_processing_stats',
    description: 'Get hourly processing metrics: total messages, spam count, classified, average latency.',
    inputSchema: {
      type: 'object',
      properties: { hours: { type: 'number', description: 'Hours to include' } },
    },
  },
  {
    name: 'get_storage_stats',
    description: 'Get storage breakdown by database tables and media types.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_worker_stats',
    description: 'Get Redis queue status: queue length, consumers, pending messages, worker health.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_enrichment_tasks',
    description: 'Get enrichment task status (translation, entity_matching, embedding, event_detection, ai_tagging, etc.).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_cache_stats',
    description: 'Get Redis cache statistics: memory usage, hit rates, connections.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_audit_stats',
    description: 'Get LLM decision audit statistics: total decisions, verification rates, performance metrics.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_spam_stats',
    description: 'Get spam statistics: total, pending review, false positives, true positives, 24h rate, by type.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_channels_admin_stats',
    description: 'Get channel inventory stats: total, active, verified, by affiliation/folder/rule/source.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_entities_admin_stats',
    description: 'Get entity catalog stats: total, with embeddings/coordinates, by type/source, top mentioned.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_rss_feeds_stats',
    description: 'Get RSS feed stats: total, active, failing, by category/trust level, article counts.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_llm_prompts_stats',
    description: 'Get LLM prompt statistics: total, active, usage count, avg latency, errors, by task.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_viral_posts',
    description: 'Get list of viral posts being tracked for enhanced comment fetching.',
    inputSchema: { type: 'object', properties: {} },
  },

  // ===========================================================================
  // SYSTEM HEALTH TOOLS
  // ===========================================================================
  {
    name: 'get_system_health',
    description: 'Basic API health check.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_hardware_config',
    description: 'Get hardware auto-detection: CPU cores, RAM, GPU, tier (laptop/server/gpu variants), LLM model config.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_system_status',
    description: 'Get detailed system status including all service health.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_metrics_overview',
    description: 'Get platform KPIs overview.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_metrics_llm',
    description: 'Get LLM/Ollama performance metrics.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_metrics_pipeline',
    description: 'Get real-time pipeline status metrics.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_metrics_services',
    description: 'Get per-service health metrics.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_llm_models',
    description: 'List configured LLM models (6 runtime-switchable models).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_llm_model_health',
    description: 'Check health of LLM models (Ollama availability).',
    inputSchema: { type: 'object', properties: {} },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

async function handleToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    // Messages
    case 'search_messages':
      return apiClient.searchMessages({
        q: args.query as string | undefined,
        channel_id: args.channel_id as number | undefined,
        days: args.days as number | undefined,
        date_from: args.date_from as string | undefined,
        date_to: args.date_to as string | undefined,
        importance_level: args.importance_level as string | undefined,
        topic: args.topic as string | undefined,
        has_media: args.has_media as boolean | undefined,
        media_type: args.media_type as string | undefined,
        language: args.language as string | undefined,
        min_views: args.min_views as number | undefined,
        min_forwards: args.min_forwards as number | undefined,
        channel_folder: args.channel_folder as string | undefined,
        page: args.page as number | undefined,
        page_size: args.page_size as number | undefined,
      });
    case 'get_message':
      return apiClient.getMessage(args.message_id as number);
    case 'get_message_album':
      return apiClient.getMessageAlbum(args.message_id as number);
    case 'get_message_network':
      return apiClient.getMessageNetwork(args.message_id as number, {
        include_similar: args.include_similar as boolean | undefined,
        similarity_threshold: args.similarity_threshold as number | undefined,
        max_similar: args.max_similar as number | undefined,
      });
    case 'get_message_timeline':
      return apiClient.getMessageTimeline(args.message_id as number, {
        before_count: args.before_count as number | undefined,
        after_count: args.after_count as number | undefined,
        same_channel_only: args.same_channel_only as boolean | undefined,
        use_semantic: args.use_semantic as boolean | undefined,
        use_events: args.use_events as boolean | undefined,
        similarity_threshold: args.similarity_threshold as number | undefined,
      });

    // Semantic Search
    case 'semantic_search':
      return apiClient.semanticSearch({
        q: args.query as string,
        similarity_threshold: args.similarity_threshold as number | undefined,
        limit: args.limit as number | undefined,
        channel_id: args.channel_id as number | undefined,
        importance_level: args.importance_level as string | undefined,
        days: args.days as number | undefined,
      });
    case 'find_similar_messages':
      return apiClient.findSimilarMessages(args.message_id as number, {
        similarity_threshold: args.similarity_threshold as number | undefined,
        limit: args.limit as number | undefined,
      });
    case 'get_tags':
      return apiClient.getTags({
        tag_type: args.tag_type as string | undefined,
        limit: args.limit as number | undefined,
      });
    case 'search_by_tags':
      return apiClient.searchByTags({
        tags: args.tags as string,
        match_all: args.match_all as boolean | undefined,
        limit: args.limit as number | undefined,
      });

    // Unified Search
    case 'unified_search':
      return apiClient.unifiedSearch({
        q: args.query as string,
        mode: args.mode as 'text' | 'semantic' | undefined,
        types: args.types as string | undefined,
        limit_per_type: args.limit_per_type as number | undefined,
        days: args.days as number | undefined,
        location: args.location as string | undefined,
        lat: args.lat as number | undefined,
        lng: args.lng as number | undefined,
        radius_km: args.radius_km as number | undefined,
      });

    // Channels
    case 'list_channels':
      return apiClient.listChannels({
        active_only: args.active_only as boolean | undefined,
        rule: args.rule as string | undefined,
        folder: args.folder as string | undefined,
        verified_only: args.verified_only as boolean | undefined,
        limit: args.limit as number | undefined,
      });
    case 'get_channel':
      return apiClient.getChannel(args.channel_id as number);
    case 'get_channel_stats':
      return apiClient.getChannelStats(args.channel_id as number);
    case 'get_channel_network':
      return apiClient.getChannelNetwork(args.channel_id as number, {
        similarity_threshold: args.similarity_threshold as number | undefined,
        max_messages: args.max_messages as number | undefined,
        time_window: args.time_window as string | undefined,
        include_clusters: args.include_clusters as boolean | undefined,
      });

    // Social Graph
    case 'get_message_social_graph':
      return apiClient.getMessageSocialGraph(args.message_id as number, {
        include_forwards: args.include_forwards as boolean | undefined,
        include_replies: args.include_replies as boolean | undefined,
        max_depth: args.max_depth as number | undefined,
        max_comments: args.max_comments as number | undefined,
      });
    case 'get_channel_influence':
      return apiClient.getChannelInfluence(args.channel_id as number);
    case 'get_influence_network':
      return apiClient.getInfluenceNetwork({
        min_forwards: args.min_forwards as number | undefined,
        days: args.days as number | undefined,
        limit: args.limit as number | undefined,
      });
    case 'get_engagement_timeline':
      return apiClient.getEngagementTimeline(args.message_id as number);
    case 'get_message_comments':
      return apiClient.getMessageComments(args.message_id as number, {
        limit: args.limit as number | undefined,
        offset: args.offset as number | undefined,
      });
    case 'get_top_forwarded':
      return apiClient.getTopForwarded({
        days: args.days as number | undefined,
        limit: args.limit as number | undefined,
      });
    case 'get_top_influencers':
      return apiClient.getTopInfluencers({
        days: args.days as number | undefined,
        limit: args.limit as number | undefined,
      });

    // Entities
    case 'search_entities':
      return apiClient.searchEntities({
        q: args.query as string,
        source: args.source as string | undefined,
        entity_type: args.entity_type as string | undefined,
        limit: args.limit as number | undefined,
      });
    case 'get_entity':
      return apiClient.getEntity(args.source as string, args.entity_id as string, {
        include_linked: args.include_linked as boolean | undefined,
      });
    case 'get_entity_relationships':
      return apiClient.getEntityRelationships(args.source as string, args.entity_id as string, {
        refresh: args.refresh as boolean | undefined,
      });
    case 'get_entity_mentions':
      return apiClient.getEntityMessages(args.source as string, args.entity_id as string, {
        limit: args.limit as number | undefined,
      });

    // Events
    case 'list_events':
      return apiClient.listEvents({
        page: args.page as number | undefined,
        page_size: args.page_size as number | undefined,
        tab: args.tab as 'active' | 'major' | 'archived' | 'all' | undefined,
        tier_status: args.tier_status as string | undefined,
        event_type: args.event_type as string | undefined,
        search: args.search as string | undefined,
        search_mode: args.search_mode as 'text' | 'semantic' | undefined,
      });
    case 'get_event_stats':
      return apiClient.getEventStats();
    case 'get_event':
      return apiClient.getEvent(args.event_id as number, {
        include_messages: args.include_messages as boolean | undefined,
        include_sources: args.include_sources as boolean | undefined,
        message_limit: args.message_limit as number | undefined,
      });
    case 'get_event_timeline':
      return apiClient.getEventTimeline(args.event_id as number);
    case 'get_events_for_message':
      return apiClient.getEventsForMessage(args.message_id as number);

    // Analytics
    case 'get_timeline_stats':
      return apiClient.getTimelineStats({
        granularity: args.granularity as 'hour' | 'day' | 'week' | 'month' | 'year' | undefined,
        channel_id: args.channel_id as number | undefined,
        topic: args.topic as string | undefined,
        importance_level: args.importance_level as string | undefined,
        days: args.days as number | undefined,
      });
    case 'get_topic_distribution':
      return apiClient.getTopicDistribution({
        days: args.days as number | undefined,
        limit: args.limit as number | undefined,
      });
    case 'get_language_distribution':
      return apiClient.getLanguageDistribution({ days: args.days as number | undefined });
    case 'get_channel_analytics':
      return apiClient.getChannelAnalytics({
        days: args.days as number | undefined,
        limit: args.limit as number | undefined,
      });
    case 'get_activity_heatmap':
      return apiClient.getHeatmap({ days: args.days as number | undefined });
    case 'get_entity_analytics':
      return apiClient.getEntityAnalytics({
        days: args.days as number | undefined,
        limit: args.limit as number | undefined,
      });
    case 'get_media_analytics':
      return apiClient.getMediaAnalytics();

    // Map / Geolocation
    case 'get_map_messages':
      return apiClient.getMapMessages({
        bounds: args.bounds as string | undefined,
        zoom: args.zoom as number | undefined,
        cluster: args.cluster as boolean | undefined,
        cluster_grid_size: args.cluster_grid_size as number | undefined,
        days: args.days as number | undefined,
        include_confidence: args.include_confidence as boolean | undefined,
      });
    case 'get_map_clusters':
      return apiClient.getMapClusters({
        bounds: args.bounds as string | undefined,
        tier_status: args.tier_status as string | undefined,
        days: args.days as number | undefined,
      });
    case 'get_map_events':
      return apiClient.getMapEvents({ bounds: args.bounds as string | undefined });
    case 'get_map_heatmap':
      return apiClient.getMapHeatmap({
        zoom: args.zoom as number | undefined,
        bounds: args.bounds as string | undefined,
        grid_size: args.grid_size as number | undefined,
      });
    case 'suggest_locations':
      return apiClient.suggestLocations({
        q: args.query as string,
        limit: args.limit as number | undefined,
      });
    case 'reverse_geocode':
      return apiClient.reverseGeocode({
        lat: args.lat as number,
        lng: args.lng as number,
      });

    // Stream
    case 'get_unified_stream':
      return apiClient.getUnifiedStream({
        limit: args.limit as number | undefined,
        sources: args.sources as string | undefined,
        categories: args.categories as string | undefined,
        importance_level: args.importance_level as string | undefined,
        hours: args.hours as number | undefined,
      });

    // Validation
    case 'validate_message':
      return apiClient.validateMessage(args.message_id as number);
    case 'get_message_correlations':
      return apiClient.getCorrelations(args.message_id as number);

    // Media
    case 'get_media_gallery':
      return apiClient.getMediaGallery({
        channel_id: args.channel_id as number | undefined,
        media_type: args.media_type as string | undefined,
        date_from: args.date_from as string | undefined,
        date_to: args.date_to as string | undefined,
        limit: args.limit as number | undefined,
        offset: args.offset as number | undefined,
      });

    // Admin Stats
    case 'get_platform_dashboard':
      return apiClient.getAdminDashboard();
    case 'get_platform_stats_overview':
      return apiClient.getAdminStatsOverview();
    case 'get_data_quality_stats':
      return apiClient.getAdminStatsQuality();
    case 'get_processing_stats':
      return apiClient.getAdminStatsProcessing({ hours: args.hours as number | undefined });
    case 'get_storage_stats':
      return apiClient.getAdminStatsStorage();
    case 'get_worker_stats':
      return apiClient.getAdminWorkersStats();
    case 'get_enrichment_tasks':
      return apiClient.getAdminEnrichmentTasks();
    case 'get_cache_stats':
      return apiClient.getAdminCacheStats();
    case 'get_audit_stats':
      return apiClient.getAdminAuditStats();
    case 'get_spam_stats':
      return apiClient.getAdminSpamStats();
    case 'get_channels_admin_stats':
      return apiClient.getAdminChannelsStats();
    case 'get_entities_admin_stats':
      return apiClient.getAdminEntitiesStats();
    case 'get_rss_feeds_stats':
      return apiClient.getAdminFeedsStats();
    case 'get_llm_prompts_stats':
      return apiClient.getAdminPromptsStats();
    case 'get_viral_posts':
      return apiClient.getAdminViralPosts();

    // System Health
    case 'get_system_health':
      return apiClient.getHealth();
    case 'get_hardware_config':
      return apiClient.getHardwareConfig();
    case 'get_system_status':
      return apiClient.getSystemStatus();
    case 'get_metrics_overview':
      return apiClient.getMetricsOverview();
    case 'get_metrics_llm':
      return apiClient.getMetricsLLM();
    case 'get_metrics_pipeline':
      return apiClient.getMetricsPipeline();
    case 'get_metrics_services':
      return apiClient.getMetricsServices();
    case 'list_llm_models':
      return apiClient.listModels();
    case 'get_llm_model_health':
      return apiClient.getModelHealth();

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// =============================================================================
// MCP Server Setup
// =============================================================================

const server = new Server(
  { name: 'osint-mcp-server', version: '2.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await handleToolCall(name, args as Record<string, unknown>);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// =============================================================================
// Main
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OSINT MCP Server v2.0.0 running');
  console.error(`API URL: ${API_BASE_URL}`);
  console.error(`Tools available: ${tools.length}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
