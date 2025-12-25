#!/usr/bin/env node

/**
 * OSINT Intelligence Platform MCP Server
 *
 * Provides tools for Claude to interact with the OSINT platform API:
 * - Message search and retrieval
 * - Semantic (AI-powered) search
 * - Channel management
 * - Entity lookup (OpenSanctions, Wikidata)
 * - Event/cluster analysis
 * - Analytics and social graph
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { OsintApiClient } from './api-client.js';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = process.env.OSINT_API_URL || 'http://localhost:8000';
const API_KEY = process.env.OSINT_API_KEY;
const JWT_TOKEN = process.env.OSINT_JWT_TOKEN;

// Initialize API client
const apiClient = new OsintApiClient({
  baseUrl: API_BASE_URL,
  apiKey: API_KEY,
  jwtToken: JWT_TOKEN,
});

// =============================================================================
// Tool Definitions
// =============================================================================

const tools: Tool[] = [
  // ---------------------------------------------------------------------------
  // Message Tools
  // ---------------------------------------------------------------------------
  {
    name: 'search_messages',
    description:
      'Search Telegram messages with full-text search and filters. ' +
      'Supports filtering by channel, date range, importance level, topic, and media presence.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text (full-text search)',
        },
        channel_id: {
          type: 'number',
          description: 'Filter by specific channel ID',
        },
        days: {
          type: 'number',
          description: 'Limit to last N days (default: all time)',
        },
        date_from: {
          type: 'string',
          description: 'Start date (ISO format: YYYY-MM-DD)',
        },
        date_to: {
          type: 'string',
          description: 'End date (ISO format: YYYY-MM-DD)',
        },
        importance_level: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Filter by AI-assigned importance level',
        },
        topic: {
          type: 'string',
          description: 'Filter by topic (e.g., "military", "politics", "humanitarian")',
        },
        has_media: {
          type: 'boolean',
          description: 'Filter for messages with media attachments',
        },
        page: {
          type: 'number',
          description: 'Page number (default: 1)',
        },
        page_size: {
          type: 'number',
          description: 'Results per page (default: 20, max: 100)',
        },
      },
    },
  },
  {
    name: 'get_message',
    description:
      'Get detailed information about a specific message by ID. ' +
      'Returns full content, media, entities, social graph data, and AI analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        message_id: {
          type: 'number',
          description: 'Message database ID',
        },
      },
      required: ['message_id'],
    },
  },
  {
    name: 'get_message_social_graph',
    description:
      'Get the social graph for a message - forwards, reactions, replies, comments, and influence chain.',
    inputSchema: {
      type: 'object',
      properties: {
        message_id: {
          type: 'number',
          description: 'Message database ID',
        },
      },
      required: ['message_id'],
    },
  },

  // ---------------------------------------------------------------------------
  // Semantic Search Tools
  // ---------------------------------------------------------------------------
  {
    name: 'semantic_search',
    description:
      'AI-powered semantic search - find messages by meaning, not just keywords. ' +
      'Uses 384-dimensional vector embeddings for similarity matching.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query describing what you want to find',
        },
        similarity_threshold: {
          type: 'number',
          description: 'Minimum similarity score (0-1, default: 0.7)',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 10)',
        },
        channel_id: {
          type: 'number',
          description: 'Limit search to specific channel',
        },
        days: {
          type: 'number',
          description: 'Limit to last N days',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_similar_messages',
    description:
      'Find messages similar to a given message using AI embeddings. ' +
      'Useful for finding related content or tracking narratives.',
    inputSchema: {
      type: 'object',
      properties: {
        message_id: {
          type: 'number',
          description: 'Source message ID to find similar content for',
        },
        similarity_threshold: {
          type: 'number',
          description: 'Minimum similarity score (0-1, default: 0.7)',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 10)',
        },
      },
      required: ['message_id'],
    },
  },

  // ---------------------------------------------------------------------------
  // Unified Search Tool
  // ---------------------------------------------------------------------------
  {
    name: 'unified_search',
    description:
      'Search across ALL platform data sources at once: ' +
      'Telegram messages, events, RSS articles, and entities. ' +
      'Returns grouped results by type.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        mode: {
          type: 'string',
          enum: ['text', 'semantic'],
          description: 'Search mode (default: text)',
        },
        types: {
          type: 'string',
          description: 'Comma-separated types to search (e.g., "messages,events,entities")',
        },
        limit_per_type: {
          type: 'number',
          description: 'Max results per type (default: 5)',
        },
        days: {
          type: 'number',
          description: 'Limit to last N days',
        },
      },
      required: ['query'],
    },
  },

  // ---------------------------------------------------------------------------
  // Channel Tools
  // ---------------------------------------------------------------------------
  {
    name: 'list_channels',
    description:
      'List monitored Telegram channels with optional filters. ' +
      'Shows channel name, folder, rule, and message counts.',
    inputSchema: {
      type: 'object',
      properties: {
        active_only: {
          type: 'boolean',
          description: 'Only show active channels (default: true)',
        },
        rule: {
          type: 'string',
          enum: ['archive_all', 'selective_archive', 'test', 'staging'],
          description: 'Filter by processing rule',
        },
        folder: {
          type: 'string',
          description: 'Filter by Telegram folder name (partial match)',
        },
        verified_only: {
          type: 'boolean',
          description: 'Only show verified channels',
        },
        limit: {
          type: 'number',
          description: 'Max channels to return (default: 100)',
        },
      },
    },
  },
  {
    name: 'get_channel',
    description: 'Get detailed information about a specific channel.',
    inputSchema: {
      type: 'object',
      properties: {
        channel_id: {
          type: 'number',
          description: 'Channel database ID or Telegram ID',
        },
      },
      required: ['channel_id'],
    },
  },
  {
    name: 'get_channel_stats',
    description:
      'Get statistics for a channel - message counts, media counts, activity timeline.',
    inputSchema: {
      type: 'object',
      properties: {
        channel_id: {
          type: 'number',
          description: 'Channel database ID or Telegram ID',
        },
      },
      required: ['channel_id'],
    },
  },
  {
    name: 'get_channel_network',
    description:
      'Get the network graph for a channel - shows forwarding relationships with other channels.',
    inputSchema: {
      type: 'object',
      properties: {
        channel_id: {
          type: 'number',
          description: 'Channel database ID',
        },
        depth: {
          type: 'number',
          description: 'Network traversal depth (default: 1)',
        },
      },
      required: ['channel_id'],
    },
  },

  // ---------------------------------------------------------------------------
  // Entity Tools
  // ---------------------------------------------------------------------------
  {
    name: 'search_entities',
    description:
      'Search for entities (people, organizations, military units). ' +
      'Sources include curated lists and OpenSanctions.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Entity name or partial name to search',
        },
        source: {
          type: 'string',
          enum: ['curated', 'opensanctions', 'all'],
          description: 'Entity source to search (default: all)',
        },
        entity_type: {
          type: 'string',
          description: 'Filter by type (person, organization, military_unit, etc.)',
        },
        limit: {
          type: 'number',
          description: 'Max results (default: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_entity',
    description:
      'Get detailed entity profile with metadata, aliases, and linked content counts.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_id: {
          type: 'string',
          description: 'Entity ID (e.g., "Q12345" for Wikidata IDs or database ID)',
        },
      },
      required: ['entity_id'],
    },
  },
  {
    name: 'get_entity_relationships',
    description:
      'Get entity relationships from Wikidata - corporate connections, political positions, associates.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_id: {
          type: 'string',
          description: 'Entity ID with Wikidata link',
        },
      },
      required: ['entity_id'],
    },
  },
  {
    name: 'get_entity_mentions',
    description: 'Get messages that mention a specific entity.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_id: {
          type: 'string',
          description: 'Entity ID',
        },
        limit: {
          type: 'number',
          description: 'Max messages to return (default: 20)',
        },
      },
      required: ['entity_id'],
    },
  },

  // ---------------------------------------------------------------------------
  // Event/Cluster Tools
  // ---------------------------------------------------------------------------
  {
    name: 'list_events',
    description:
      'List detected events (message clusters). ' +
      'Events are groups of messages about the same real-world incident.',
    inputSchema: {
      type: 'object',
      properties: {
        tier: {
          type: 'string',
          enum: ['rumor', 'unconfirmed', 'confirmed', 'verified'],
          description: 'Filter by verification tier',
        },
        days: {
          type: 'number',
          description: 'Limit to last N days',
        },
        location: {
          type: 'string',
          description: 'Filter by location name',
        },
        limit: {
          type: 'number',
          description: 'Max events to return (default: 20)',
        },
      },
    },
  },
  {
    name: 'get_event',
    description: 'Get detailed event information including tier, location, and contributing channels.',
    inputSchema: {
      type: 'object',
      properties: {
        event_id: {
          type: 'number',
          description: 'Event cluster ID',
        },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'get_event_messages',
    description: 'Get all messages that are part of an event cluster.',
    inputSchema: {
      type: 'object',
      properties: {
        event_id: {
          type: 'number',
          description: 'Event cluster ID',
        },
      },
      required: ['event_id'],
    },
  },

  // ---------------------------------------------------------------------------
  // Analytics Tools
  // ---------------------------------------------------------------------------
  {
    name: 'get_timeline_stats',
    description:
      'Get message volume over time for visualizations. ' +
      'Supports hourly, daily, weekly, monthly granularity.',
    inputSchema: {
      type: 'object',
      properties: {
        granularity: {
          type: 'string',
          enum: ['hour', 'day', 'week', 'month', 'year'],
          description: 'Time bucket size (default: day)',
        },
        channel_id: {
          type: 'number',
          description: 'Filter by channel',
        },
        topic: {
          type: 'string',
          description: 'Filter by topic',
        },
        importance_level: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Filter by importance',
        },
        days: {
          type: 'number',
          description: 'Limit to last N days',
        },
      },
    },
  },
  {
    name: 'get_topic_distribution',
    description: 'Get distribution of messages across topics.',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Time period in days',
        },
        limit: {
          type: 'number',
          description: 'Max topics to return',
        },
      },
    },
  },
  {
    name: 'get_channel_analytics',
    description: 'Get analytics for all channels - message volume, engagement, activity trends.',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Time period in days',
        },
        limit: {
          type: 'number',
          description: 'Max channels to return',
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Map/Geo Tools
  // ---------------------------------------------------------------------------
  {
    name: 'get_map_messages',
    description:
      'Get geolocated messages as GeoJSON for map display. ' +
      'Supports bounding box filtering and server-side clustering.',
    inputSchema: {
      type: 'object',
      properties: {
        bbox: {
          type: 'string',
          description: 'Bounding box: "minLng,minLat,maxLng,maxLat"',
        },
        days: {
          type: 'number',
          description: 'Limit to last N days',
        },
        zoom: {
          type: 'number',
          description: 'Map zoom level (affects clustering)',
        },
      },
    },
  },
  {
    name: 'get_map_clusters',
    description: 'Get event clusters with geographic locations for map display.',
    inputSchema: {
      type: 'object',
      properties: {
        bbox: {
          type: 'string',
          description: 'Bounding box: "minLng,minLat,maxLng,maxLat"',
        },
        tier: {
          type: 'string',
          enum: ['rumor', 'unconfirmed', 'confirmed', 'verified'],
          description: 'Filter by verification tier',
        },
        days: {
          type: 'number',
          description: 'Limit to last N days',
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // System Tools
  // ---------------------------------------------------------------------------
  {
    name: 'get_system_health',
    description: 'Check API health status.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_system_status',
    description: 'Get detailed system status including service health, queue depths, and statistics.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
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
        page: args.page as number | undefined,
        page_size: args.page_size as number | undefined,
      });

    case 'get_message':
      return apiClient.getMessage(args.message_id as number);

    case 'get_message_social_graph':
      return apiClient.getMessageSocialGraph(args.message_id as number);

    // Semantic Search
    case 'semantic_search':
      return apiClient.semanticSearch({
        q: args.query as string,
        similarity_threshold: args.similarity_threshold as number | undefined,
        limit: args.limit as number | undefined,
        channel_id: args.channel_id as number | undefined,
        days: args.days as number | undefined,
      });

    case 'find_similar_messages':
      return apiClient.findSimilarMessages(args.message_id as number, {
        similarity_threshold: args.similarity_threshold as number | undefined,
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
        depth: args.depth as number | undefined,
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
      return apiClient.getEntity(args.entity_id as string);

    case 'get_entity_relationships':
      return apiClient.getEntityRelationships(args.entity_id as string);

    case 'get_entity_mentions':
      return apiClient.getEntityLinkedMessages(args.entity_id as string, {
        limit: args.limit as number | undefined,
      });

    // Events
    case 'list_events':
      return apiClient.listEvents({
        tier: args.tier as string | undefined,
        days: args.days as number | undefined,
        location: args.location as string | undefined,
        limit: args.limit as number | undefined,
      });

    case 'get_event':
      return apiClient.getEvent(args.event_id as number);

    case 'get_event_messages':
      return apiClient.getEventMessages(args.event_id as number);

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

    case 'get_channel_analytics':
      return apiClient.getChannelAnalytics({
        days: args.days as number | undefined,
        limit: args.limit as number | undefined,
      });

    // Map/Geo
    case 'get_map_messages':
      return apiClient.getMapMessages({
        bbox: args.bbox as string | undefined,
        days: args.days as number | undefined,
        zoom: args.zoom as number | undefined,
      });

    case 'get_map_clusters':
      return apiClient.getMapClusters({
        bbox: args.bbox as string | undefined,
        tier: args.tier as string | undefined,
        days: args.days as number | undefined,
      });

    // System
    case 'get_system_health':
      return apiClient.getHealth();

    case 'get_system_status':
      return apiClient.getSystemStatus();

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// =============================================================================
// MCP Server Setup
// =============================================================================

const server = new Server(
  {
    name: 'osint-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await handleToolCall(name, args as Record<string, unknown>);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// =============================================================================
// Main Entry Point
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OSINT MCP Server running on stdio');
  console.error(`API URL: ${API_BASE_URL}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
