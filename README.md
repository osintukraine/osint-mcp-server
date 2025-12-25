# OSINT MCP Server

MCP (Model Context Protocol) server for the OSINT Intelligence Platform, enabling Claude and other AI assistants to interact with your Telegram intelligence archive.

## Features

This MCP server provides **27 granular tools** organized into 8 categories:

### Message Tools
- `search_messages` - Full-text search with 10+ filters
- `get_message` - Get detailed message with media and entities
- `get_message_social_graph` - Forwards, reactions, replies, comments

### Semantic Search Tools
- `semantic_search` - AI-powered meaning-based search
- `find_similar_messages` - Find content similar to a message

### Unified Search
- `unified_search` - Search across messages, events, RSS, and entities

### Channel Tools
- `list_channels` - List monitored Telegram channels
- `get_channel` - Channel details
- `get_channel_stats` - Message counts, activity timeline
- `get_channel_network` - Forwarding relationships

### Entity Tools
- `search_entities` - Search people, orgs, military units
- `get_entity` - Entity profile with aliases and metadata
- `get_entity_relationships` - Wikidata connections (employers, positions)
- `get_entity_mentions` - Messages mentioning an entity

### Event Tools
- `list_events` - Detected event clusters
- `get_event` - Event details and verification tier
- `get_event_messages` - Messages in an event cluster

### Analytics Tools
- `get_timeline_stats` - Message volume over time
- `get_topic_distribution` - Topic breakdown
- `get_channel_analytics` - Per-channel statistics

### Map/Geo Tools
- `get_map_messages` - Geolocated messages as GeoJSON
- `get_map_clusters` - Geographic event clusters

### System Tools
- `get_system_health` - API health check
- `get_system_status` - Detailed system status

## Installation

```bash
# Clone the repository
git clone https://github.com/osintukraine/osint-mcp-server.git
cd osint-mcp-server

# Install dependencies
npm install

# Build
npm run build
```

## Configuration

The server uses environment variables for configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `OSINT_API_URL` | OSINT Platform API base URL | `http://localhost:8000` |
| `OSINT_API_KEY` | API key for authentication | (none) |
| `OSINT_JWT_TOKEN` | JWT token for authentication | (none) |

### Claude Code Configuration

Add to your `~/.claude/claude_code_settings.json`:

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

Or with authentication:

```json
{
  "mcpServers": {
    "osint": {
      "command": "node",
      "args": ["/path/to/osint-mcp-server/dist/index.js"],
      "env": {
        "OSINT_API_URL": "https://api.osint.example.com",
        "OSINT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### VS Code with Claude Extension

Add to your project's `.vscode/mcp.json`:

```json
{
  "servers": {
    "osint": {
      "command": "node",
      "args": ["${workspaceFolder}/../osint-mcp-server/dist/index.js"],
      "env": {
        "OSINT_API_URL": "http://localhost:8000"
      }
    }
  }
}
```

## Development

```bash
# Watch mode (auto-rebuild on changes)
npm run dev

# Type checking
npm run typecheck

# Test with MCP Inspector
npm run inspector
```

## Usage Examples

Once configured, Claude can use these tools naturally:

**Search for recent high-importance messages:**
> "Search for messages about Bakhmut from the last 7 days with high importance"

**Find similar content:**
> "Find messages similar to message #12345"

**Analyze an entity:**
> "Look up the entity Putin and show me their relationships and recent mentions"

**Get event details:**
> "List confirmed events from the last 24 hours and show me the messages in the top event"

**Check system health:**
> "What's the current status of the OSINT platform?"

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Claude Code    │────▶│  MCP Server      │────▶│  OSINT API      │
│  (AI Assistant) │     │  (This project)  │     │  (FastAPI)      │
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

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Related Projects

- [OSINT Intelligence Platform](https://github.com/osintukraine/osint-intelligence-platform) - Main platform
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
