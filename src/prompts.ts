/**
 * MCP Prompts for OSINT Platform
 *
 * Pre-defined prompt templates that guide users through common OSINT workflows.
 * These help users who may not know which tools to use or how to combine them.
 */

import { Prompt } from '@modelcontextprotocol/sdk/types.js';

export const prompts: Prompt[] = [
  // ===========================================================================
  // INVESTIGATION WORKFLOWS
  // ===========================================================================
  {
    name: 'investigate_entity',
    description:
      'Investigate a person, organization, or military unit. ' +
      'Searches both curated entities and OpenSanctions, finds relationships, ' +
      'and retrieves recent mentions in Telegram messages.',
    arguments: [
      {
        name: 'entity_name',
        description: 'Name of the person, organization, or unit to investigate',
        required: true,
      },
      {
        name: 'entity_type',
        description: 'Type: person, organization, military_unit, equipment (optional)',
        required: false,
      },
    ],
  },
  {
    name: 'validate_claim',
    description:
      'Fact-check a Telegram message by cross-referencing with RSS news sources. ' +
      'Returns whether the claim is confirmed, contradicted, or unverified.',
    arguments: [
      {
        name: 'message_id',
        description: 'The message ID to validate',
        required: true,
      },
    ],
  },
  {
    name: 'track_event',
    description:
      'Track an emerging event by finding related messages across channels, ' +
      'building the event timeline, and showing the verification tier progression.',
    arguments: [
      {
        name: 'event_id',
        description: 'Event cluster ID to track',
        required: false,
      },
      {
        name: 'search_query',
        description: 'Or search for events by keyword/location',
        required: false,
      },
    ],
  },
  {
    name: 'analyze_channel',
    description:
      'Deep analysis of a Telegram channel: statistics, influence network, ' +
      'top topics, forwarding relationships, and recent high-importance messages.',
    arguments: [
      {
        name: 'channel_id',
        description: 'Channel ID to analyze',
        required: true,
      },
    ],
  },
  {
    name: 'trace_narrative',
    description:
      'Trace how a narrative spreads across channels using semantic similarity. ' +
      'Find the original message and track its propagation through forwards.',
    arguments: [
      {
        name: 'message_id',
        description: 'Starting message ID',
        required: false,
      },
      {
        name: 'search_query',
        description: 'Or search for the narrative by description',
        required: false,
      },
    ],
  },

  // ===========================================================================
  // MONITORING WORKFLOWS
  // ===========================================================================
  {
    name: 'daily_briefing',
    description:
      'Generate a daily intelligence briefing: high-importance messages, ' +
      'confirmed events, trending topics, and any system alerts.',
    arguments: [
      {
        name: 'hours',
        description: 'Hours to look back (default: 24)',
        required: false,
      },
      {
        name: 'focus_topic',
        description: 'Optional topic focus: combat, equipment, casualties, etc.',
        required: false,
      },
    ],
  },
  {
    name: 'geographic_sitrep',
    description:
      'Situation report for a geographic area: geolocated messages, ' +
      'event clusters, and activity heatmap.',
    arguments: [
      {
        name: 'location',
        description: 'Location name (e.g., Bakhmut, Kharkiv Oblast)',
        required: true,
      },
      {
        name: 'days',
        description: 'Days to look back (default: 7)',
        required: false,
      },
    ],
  },
  {
    name: 'platform_health_check',
    description:
      'Check platform health: worker queues, enrichment tasks, data quality, ' +
      'LLM performance, and any processing issues.',
    arguments: [],
  },

  // ===========================================================================
  // DISCOVERY WORKFLOWS
  // ===========================================================================
  {
    name: 'find_viral_content',
    description:
      'Find viral content: most forwarded messages, top influencers, ' +
      'and coordinated amplification patterns.',
    arguments: [
      {
        name: 'days',
        description: 'Days to look back (default: 7)',
        required: false,
      },
      {
        name: 'topic',
        description: 'Optional topic filter',
        required: false,
      },
    ],
  },
  {
    name: 'discover_connections',
    description:
      'Discover hidden connections: entity relationships, channel influence ' +
      'networks, and cross-affiliation patterns.',
    arguments: [
      {
        name: 'start_entity',
        description: 'Entity name to start from',
        required: false,
      },
      {
        name: 'start_channel',
        description: 'Or channel ID to start from',
        required: false,
      },
    ],
  },
];

/**
 * Get the expanded prompt content for a given prompt name and arguments
 */
export function getPromptContent(
  name: string,
  args: Record<string, string>
): string {
  switch (name) {
    case 'investigate_entity':
      return `# Entity Investigation: ${args.entity_name}

## Investigation Workflow

I'll investigate "${args.entity_name}" using these steps:

1. **Search Entities** - Search both curated (1,425+ entities) and OpenSanctions (10,000+) databases
2. **Get Entity Profile** - Retrieve full profile with aliases, metadata, and linked counts
3. **Get Relationships** - Query Wikidata for corporate connections, political positions, associates
4. **Find Mentions** - Get recent Telegram messages mentioning this entity
5. **Cross-Reference Events** - Check if entity is linked to any detected events

### Tools to use:
- \`search_entities\` with query="${args.entity_name}"${args.entity_type ? `, entity_type="${args.entity_type}"` : ''}
- \`get_entity\` for the matched entity
- \`get_entity_relationships\` for Wikidata connections
- \`get_entity_mentions\` for recent messages

### Key things to look for:
- Sanctions status (OFAC, EU, UK lists)
- PEP (Politically Exposed Person) flags
- Corporate ownership chains
- Recent activity patterns
- Cross-channel mention frequency`;

    case 'validate_claim':
      return `# Claim Validation: Message #${args.message_id}

## Validation Workflow

I'll validate the claims in message #${args.message_id} by:

1. **Get Message Details** - Retrieve the full message with content and metadata
2. **Cross-Reference RSS** - Find correlated news articles from trusted sources
3. **Check Validation Status** - Get LLM validation result (confirms/contradicts/context)
4. **Find Event Context** - Check if message is part of a verified event cluster

### Tools to use:
- \`get_message\` with message_id=${args.message_id}
- \`validate_message\` to cross-reference with RSS
- \`get_message_correlations\` for related articles grouped by type
- \`get_events_for_message\` to find linked events

### Validation Categories:
- **confirms** - RSS article supports the Telegram claim
- **contradicts** - RSS article refutes the claim
- **context** - RSS provides additional context
- **alternative** - RSS presents a different perspective
- **none** - No relevant RSS articles found

### Trust Indicators:
- Event tier (rumor → unconfirmed → confirmed → verified)
- Number of independent sources
- Cross-affiliation validation (pro-UA and pro-RU sources agree)`;

    case 'track_event':
      return `# Event Tracking${args.event_id ? `: Event #${args.event_id}` : ''}

## Event Tracking Workflow

I'll track this event through its lifecycle:

1. **Get Event Details** - Retrieve event with contributing channels and messages
2. **Build Timeline** - Combine Telegram messages and RSS articles chronologically
3. **Analyze Sources** - Check channel affiliations and source diversity
4. **Check Tier Status** - Understand verification level

${args.event_id ? `### Tools to use:
- \`get_event\` with event_id=${args.event_id}, include_messages=true, include_sources=true
- \`get_event_timeline\` for chronological view
- \`get_event_stats\` for overall event statistics` : ''}

${args.search_query ? `### Tools to use:
- \`list_events\` with search="${args.search_query}"
- Then \`get_event\` and \`get_event_timeline\` for the relevant event` : ''}

### Event Tier Progression:
| Tier | Criteria |
|------|----------|
| **rumor** | Single channel reporting |
| **unconfirmed** | 2-3 channels, same affiliation |
| **confirmed** | 3+ channels, cross-affiliation |
| **verified** | Human-verified with evidence |

### Key Analysis Points:
- Time from first report to confirmation
- Channel diversity (affiliations)
- Geographic clustering
- Claim consistency across sources`;

    case 'analyze_channel':
      return `# Channel Analysis: Channel #${args.channel_id}

## Analysis Workflow

I'll provide a comprehensive analysis of this channel:

1. **Get Channel Profile** - Basic info, affiliation, verification status
2. **Get Statistics** - Message counts, spam rate, topic distribution
3. **Analyze Network** - Semantic clusters and content relationships
4. **Map Influence** - Who forwards from/to this channel
5. **Recent Activity** - High-importance messages from last 7 days

### Tools to use:
- \`get_channel\` with channel_id=${args.channel_id}
- \`get_channel_stats\` for detailed statistics
- \`get_channel_network\` for content graph
- \`get_channel_influence\` for forward relationships
- \`search_messages\` with channel_id=${args.channel_id}, importance_level="high", days=7

### Channel Metadata to Review:
- **Affiliation**: russia, ukraine, neutral, unknown
- **Source Type**: state_media, military_unit, journalist, osint_aggregator, etc.
- **Folder Rule**: archive_all (important) vs selective_archive (filtered)
- **Verified Badge**: Telegram verification status

### Influence Indicators:
- Forwarding relationships (who amplifies this channel)
- Engagement patterns (views, forwards, reactions)
- Cross-affiliation reach`;

    case 'trace_narrative':
      return `# Narrative Tracing${args.message_id ? `: Starting from Message #${args.message_id}` : ''}

## Narrative Tracing Workflow

I'll trace how this narrative spreads across the platform:

1. **Find Origin** - Identify the earliest instance of this narrative
2. **Find Similar** - Use semantic search to find related messages
3. **Map Propagation** - Track forwards and timing across channels
4. **Analyze Reach** - Calculate engagement and cross-affiliation spread

${args.message_id ? `### Tools to use:
- \`get_message\` with message_id=${args.message_id}
- \`find_similar_messages\` to find semantic matches
- \`get_message_social_graph\` for forward chain
- \`get_engagement_timeline\` for virality pattern` : ''}

${args.search_query ? `### Tools to use:
- \`semantic_search\` with query="${args.search_query}"
- Then analyze the earliest result and trace forward` : ''}

### Propagation Indicators:
- **Forward Chains**: Direct resharing with attribution
- **Semantic Similarity**: Same content, different wording
- **Temporal Clustering**: Multiple posts within short window
- **Coordination Signals**: Near-simultaneous posting across channels`;

    case 'daily_briefing':
      return `# Daily Intelligence Briefing

## Briefing Parameters
- **Time Window**: ${args.hours || 24} hours
${args.focus_topic ? `- **Focus Topic**: ${args.focus_topic}` : '- **Focus**: All topics'}

## Briefing Workflow

I'll compile a comprehensive daily briefing:

1. **High-Priority Messages** - Important messages from the time window
2. **Confirmed Events** - Events that reached confirmed/verified status
3. **Topic Trends** - What topics are most active
4. **Viral Content** - Most forwarded/engaged content
5. **System Status** - Platform health and any issues

### Tools to use:
- \`search_messages\` with importance_level="high", days=1${args.focus_topic ? `, topic="${args.focus_topic}"` : ''}
- \`list_events\` with tier_status="confirmed" or "verified", days=1
- \`get_topic_distribution\` with days=1
- \`get_top_forwarded\` with days=1
- \`get_platform_stats_overview\` for system health

### Topics Tracked:
combat, equipment, casualties, movements, infrastructure, humanitarian, diplomatic, intelligence, propaganda, units, locations, general`;

    case 'geographic_sitrep':
      return `# Geographic Situation Report: ${args.location}

## SITREP Parameters
- **Location**: ${args.location}
- **Time Window**: ${args.days || 7} days

## SITREP Workflow

I'll compile a geographic situation report:

1. **Geolocated Messages** - Messages with coordinates in this area
2. **Event Clusters** - Detected events in the region
3. **Activity Heatmap** - Density of activity over time
4. **Location Suggestions** - Verify the exact location match

### Tools to use:
- \`suggest_locations\` with query="${args.location}" to verify location
- \`unified_search\` with location="${args.location}", days=${args.days || 7}
- \`get_map_messages\` with bounds for the area
- \`get_map_clusters\` for event locations
- \`get_map_heatmap\` for activity density

### Geographic Context:
- Use location autocomplete to find exact coordinates
- Bounding box format: "minLng,minLat,maxLng,maxLat"
- Coordinates are (latitude, longitude) in database but (longitude, latitude) in GeoJSON`;

    case 'platform_health_check':
      return `# Platform Health Check

## Health Check Workflow

I'll perform a comprehensive platform health check:

1. **Overall Status** - Platform dashboard and service health
2. **Queue Health** - Redis worker queues and pending messages
3. **Enrichment Tasks** - Status of all 13 enrichment workers
4. **Data Quality** - Translation, embedding, and geolocation coverage
5. **LLM Performance** - Ollama model health and latency

### Tools to use:
- \`get_platform_dashboard\` - Overview metrics
- \`get_platform_stats_overview\` - Comprehensive stats
- \`get_worker_stats\` - Queue health
- \`get_enrichment_tasks\` - Task status
- \`get_data_quality_stats\` - Coverage metrics
- \`get_metrics_llm\` - LLM performance
- \`get_cache_stats\` - Redis performance

### Key Health Indicators:
| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Queue Depth | < 100 | 100-1000 | > 1000 |
| Processing Latency | < 1s | 1-5s | > 5s |
| Translation Coverage | > 95% | 80-95% | < 80% |
| LLM Availability | 100% | 95-99% | < 95% |`;

    case 'find_viral_content':
      return `# Viral Content Discovery

## Discovery Parameters
- **Time Window**: ${args.days || 7} days
${args.topic ? `- **Topic Filter**: ${args.topic}` : '- **Topics**: All'}

## Discovery Workflow

I'll find viral content and influence patterns:

1. **Top Forwarded** - Most forwarded messages
2. **Top Influencers** - Channels with highest reach
3. **Influence Network** - Cross-channel amplification patterns
4. **Engagement Trends** - Messages with unusual engagement velocity

### Tools to use:
- \`get_top_forwarded\` with days=${args.days || 7}
- \`get_top_influencers\` with days=${args.days || 7}
- \`get_influence_network\` with days=${args.days || 7}
- \`get_viral_posts\` - Currently tracked viral posts
${args.topic ? `- Filter results by topic="${args.topic}"` : ''}

### Virality Indicators:
- **Views/hour** > 1000 = High velocity
- **Forwards** > 50 = Significant reach
- **Cross-affiliation** = Narrative breakthrough
- **Comment count** > 20 = High engagement`;

    case 'discover_connections':
      return `# Connection Discovery

## Discovery Workflow

I'll discover hidden connections and relationships:

${args.start_entity ? `### Starting from Entity: ${args.start_entity}
- \`search_entities\` to find the entity
- \`get_entity_relationships\` for Wikidata connections
- \`get_entity_mentions\` for co-occurrence with other entities
- Look for shared mentions in same messages` : ''}

${args.start_channel ? `### Starting from Channel: ${args.start_channel}
- \`get_channel_influence\` for forward relationships
- \`get_influence_network\` for broader patterns
- \`get_channel_network\` for semantic content clusters
- Look for coordinated posting patterns` : ''}

### Connection Types:
- **Entity → Entity**: Shared organizations, positions, transactions
- **Channel → Channel**: Forward relationships, timing correlation
- **Entity → Channel**: Frequent mentions, source attribution
- **Cross-Affiliation**: Unexpected connections across opposing sides`;

    default:
      return `Unknown prompt: ${name}`;
  }
}
