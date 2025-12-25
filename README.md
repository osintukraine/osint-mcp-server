# OSINT MCP Server

[![npm version](https://badge.fury.io/js/%40osintukraine%2Fmcp-server.svg)](https://www.npmjs.com/package/@osintukraine/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for the [OSINT Intelligence Platform](https://github.com/osintukraine/osint-intelligence-platform), enabling Claude and other AI assistants to interact with your Telegram intelligence archive.

## Features

This MCP server provides **65 tools** organized into 14 categories for comprehensive OSINT analysis:

### Message Tools (5 tools)
| Tool | Description |
|------|-------------|
| `search_messages` | Full-text search with 15+ filters (topic, importance, language, views, etc.) |
| `get_message` | Get detailed message with media, AI tags, entities, locations |
| `get_message_album` | Get grouped media album for lightbox display |
| `get_message_network` | Entity relationship graph (Flowsint-compatible) |
| `get_message_timeline` | Temporal context - before/after, semantic, event-based |

### Semantic Search Tools (4 tools)
| Tool | Description |
|------|-------------|
| `semantic_search` | AI-powered 384-dim vector search - find by meaning |
| `find_similar_messages` | Find content similar to a specific message |
| `get_tags` | Get popular AI-generated tags (keywords, topics, emotions) |
| `search_by_tags` | Search messages by tags with AND/OR logic |

### Unified Search (1 tool)
| Tool | Description |
|------|-------------|
| `unified_search` | Search across ALL sources: messages, events, RSS, entities |

### Channel Tools (4 tools)
| Tool | Description |
|------|-------------|
| `list_channels` | List monitored Telegram channels with filters |
| `get_channel` | Channel details, affiliation, metadata |
| `get_channel_stats` | Message counts, spam rate, topic distribution |
| `get_channel_network` | Semantic relationship graph with topic clusters |

### Social Graph Tools (7 tools)
| Tool | Description |
|------|-------------|
| `get_message_social_graph` | Complete social context: forwards, replies, comments, reactions |
| `get_channel_influence` | Channel-to-channel forward relationships |
| `get_influence_network` | Platform-wide influence network |
| `get_engagement_timeline` | Virality tracking over time |
| `get_message_comments` | Discussion thread from linked chat |
| `get_top_forwarded` | Viral content leaderboard |
| `get_top_influencers` | Top influencer profiles |

### Entity Tools (4 tools)
| Tool | Description |
|------|-------------|
| `search_entities` | Search people, orgs, equipment (curated + OpenSanctions) |
| `get_entity` | Entity profile with aliases, metadata, linked counts |
| `get_entity_relationships` | Wikidata SPARQL relationships (employers, positions) |
| `get_entity_mentions` | Messages mentioning a specific entity |

### Event Tools (5 tools)
| Tool | Description |
|------|-------------|
| `list_events` | Detected event clusters by tier (rumor→confirmed→verified) |
| `get_event_stats` | Event statistics by tier and type |
| `get_event` | Event details with channels, messages, RSS sources |
| `get_event_timeline` | Chronological timeline combining Telegram + RSS |
| `get_events_for_message` | Events linked to a specific message |

### Analytics Tools (7 tools)
| Tool | Description |
|------|-------------|
| `get_timeline_stats` | Message volume over time (hour/day/week/month) |
| `get_topic_distribution` | Distribution across 13 topics |
| `get_language_distribution` | Language breakdown (uk, ru, en, etc.) |
| `get_channel_analytics` | Per-channel performance metrics |
| `get_activity_heatmap` | Daily activity for calendar visualization |
| `get_entity_analytics` | Most mentioned entities over time |
| `get_media_analytics` | Media archival stats with deduplication metrics |

### Map/Geo Tools (6 tools)
| Tool | Description |
|------|-------------|
| `get_map_messages` | GeoJSON messages with server-side clustering |
| `get_map_clusters` | Event clusters by geographic location |
| `get_map_events` | Confirmed events for map display |
| `get_map_heatmap` | Density aggregation for heatmap |
| `suggest_locations` | Autocomplete from 30,000+ UA/RU locations |
| `reverse_geocode` | Find nearest location to coordinates |

### Stream Tools (1 tool)
| Tool | Description |
|------|-------------|
| `get_unified_stream` | Combined Telegram + RSS intelligence feed |

### Validation Tools (2 tools)
| Tool | Description |
|------|-------------|
| `validate_message` | Cross-reference Telegram with RSS (confirms/contradicts) |
| `get_message_correlations` | Find correlated RSS articles |

### Media Tools (1 tool)
| Tool | Description |
|------|-------------|
| `get_media_gallery` | Browse archived media by channel, type, date |

### Admin Stats Tools (15 tools)
| Tool | Description |
|------|-------------|
| `get_platform_dashboard` | Platform overview: messages, channels, entities, storage |
| `get_platform_stats_overview` | Comprehensive stats with service health |
| `get_data_quality_stats` | Enrichment coverage (translation, embeddings, geo) |
| `get_processing_stats` | Hourly processing metrics and latency |
| `get_storage_stats` | Storage breakdown by table and media type |
| `get_worker_stats` | Redis queue health and pending messages |
| `get_enrichment_tasks` | Status of 13 enrichment tasks |
| `get_cache_stats` | Redis cache hit rates and memory usage |
| `get_audit_stats` | LLM decision audit and verification rates |
| `get_spam_stats` | Spam classification metrics |
| `get_channels_admin_stats` | Channel inventory by affiliation/folder/rule |
| `get_entities_admin_stats` | Entity catalog stats and top mentioned |
| `get_rss_feeds_stats` | RSS feed health and article counts |
| `get_llm_prompts_stats` | LLM prompt performance metrics |
| `get_viral_posts` | Tracked viral posts for comment fetching |

### System Health Tools (9 tools)
| Tool | Description |
|------|-------------|
| `get_system_health` | Basic API health check |
| `get_hardware_config` | Hardware tier detection (laptop/server/GPU) |
| `get_system_status` | Detailed system status |
| `get_metrics_overview` | Platform KPIs |
| `get_metrics_llm` | Ollama/LLM performance |
| `get_metrics_pipeline` | Real-time pipeline status |
| `get_metrics_services` | Per-service health |
| `list_llm_models` | Available LLM models (6 runtime-switchable) |
| `get_llm_model_health` | LLM availability check |

## Installation

### From npm (recommended)

```bash
npm install -g @osintukraine/mcp-server
```

### From source

```bash
git clone https://github.com/osintukraine/osint-mcp-server.git
cd osint-mcp-server
npm install
npm run build
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OSINT_API_URL` | OSINT Platform API base URL | `http://localhost:8000` |
| **JWT Authentication** | | |
| `OSINT_JWT_TOKEN` | JWT token for authentication | (none) |
| **API Key Authentication** | | |
| `OSINT_API_KEY` | API key for authentication | (none) |
| **Ory Kratos Authentication** | | |
| `OSINT_ORY_USER_ID` | Ory Kratos user UUID | (none) |
| `OSINT_ORY_USER_EMAIL` | User email (optional) | (none) |
| `OSINT_ORY_USER_ROLE` | User role: authenticated, admin | `authenticated` |

### Authentication Priority

The MCP server uses the first available authentication method:

1. **JWT Token** - `OSINT_JWT_TOKEN` - Standalone JWT authentication
2. **API Key** - `OSINT_API_KEY` - Programmatic API access
3. **Ory Kratos** - `OSINT_ORY_USER_ID` - Ory identity headers

### Claude Code Configuration

Add a `.mcp.json` file to your project root:

**Using npm package:**
```json
{
  "mcpServers": {
    "osint": {
      "command": "npx",
      "args": ["@osintukraine/mcp-server"],
      "env": {
        "OSINT_API_URL": "http://localhost:8000"
      }
    }
  }
}
```

**Using local installation:**
```json
{
  "mcpServers": {
    "osint": {
      "command": "node",
      "args": ["/path/to/osint-mcp-server/dist/index.js"],
      "env": {
        "OSINT_API_URL": "http://localhost:8000"
      }
    }
  }
}
```

**With API Key authentication:**
```json
{
  "mcpServers": {
    "osint": {
      "command": "npx",
      "args": ["@osintukraine/mcp-server"],
      "env": {
        "OSINT_API_URL": "https://api.osint.example.com",
        "OSINT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**With Ory Kratos authentication:**
```json
{
  "mcpServers": {
    "osint": {
      "command": "npx",
      "args": ["@osintukraine/mcp-server"],
      "env": {
        "OSINT_API_URL": "https://api.osint.example.com",
        "OSINT_ORY_USER_ID": "your-kratos-user-uuid",
        "OSINT_ORY_USER_EMAIL": "your-email@example.com",
        "OSINT_ORY_USER_ROLE": "admin"
      }
    }
  }
}
```

## Usage Examples

Once configured, Claude can use these tools naturally:

### Message Search & Analysis
> "Search for high-importance messages about Bakhmut from the last 7 days"

> "Find messages similar to message #12345 and show their social graph"

> "Get the entity network for message #67890"

### Entity Investigation
> "Search for Putin in OpenSanctions and show relationships"

> "Find all messages mentioning the Wagner Group"

### Event Analysis
> "List confirmed events from the last 24 hours"

> "Show the timeline for event #123 with both Telegram and RSS sources"

> "Validate message #456 against news sources"

### Social Graph & Influence
> "Who are the top influencers in the last week?"

> "Show the influence network between channels"

> "Get the engagement timeline for this viral message"

### Platform Monitoring
> "What's the current platform health?"

> "Show data quality stats - translation and embedding coverage"

> "Check the worker queue status"

### Geographic Analysis
> "Get geolocated messages in the Kharkiv region"

> "Show the event heatmap for the last 48 hours"

## Development

```bash
# Watch mode (auto-rebuild on changes)
npm run dev

# Type checking
npm run typecheck

# Test with MCP Inspector
npm run inspector
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Claude Code    │────▶│  MCP Server      │────▶│  OSINT API      │
│  (AI Assistant) │     │  (65 tools)      │     │  (FastAPI)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                        │
         │  stdio transport      │  HTTP/JSON             │
         │                       │                        │
    ┌────┴────┐            ┌─────┴─────┐           ┌──────┴──────┐
    │ Request │            │ API Client│           │ PostgreSQL  │
    │ Handler │            │ (fetch)   │           │ + pgvector  │
    └─────────┘            └───────────┘           └─────────────┘
```

## License

MIT - see [LICENSE](LICENSE)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Related Projects

- [OSINT Intelligence Platform](https://github.com/osintukraine/osint-intelligence-platform) - Main platform
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
- [MCP SDK](https://github.com/anthropics/anthropic-tools) - Official MCP SDK
