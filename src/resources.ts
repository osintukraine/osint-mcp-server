/**
 * MCP Resources for OSINT Platform
 *
 * Static resources that provide platform knowledge, domain context,
 * and reference information for AI assistants.
 */

import { Resource } from '@modelcontextprotocol/sdk/types.js';

export const resources: Resource[] = [
  {
    uri: 'osint://guide/getting-started',
    name: 'Getting Started Guide',
    description: 'Introduction to the OSINT platform and common workflows',
    mimeType: 'text/markdown',
  },
  {
    uri: 'osint://reference/topics',
    name: 'Topic Classification Reference',
    description: 'The 13 topic categories used for message classification',
    mimeType: 'text/markdown',
  },
  {
    uri: 'osint://reference/event-tiers',
    name: 'Event Tier Reference',
    description: 'Event verification tiers and progression criteria',
    mimeType: 'text/markdown',
  },
  {
    uri: 'osint://reference/entity-types',
    name: 'Entity Types Reference',
    description: 'Entity types and sources (curated, OpenSanctions, Wikidata)',
    mimeType: 'text/markdown',
  },
  {
    uri: 'osint://reference/channel-affiliations',
    name: 'Channel Affiliations Reference',
    description: 'Channel affiliation types and source categories',
    mimeType: 'text/markdown',
  },
  {
    uri: 'osint://reference/geolocation',
    name: 'Geolocation Pipeline Reference',
    description: '4-stage geolocation pipeline and confidence scores',
    mimeType: 'text/markdown',
  },
  {
    uri: 'osint://workflows/investigation',
    name: 'Investigation Workflows',
    description: 'Step-by-step workflows for common investigation tasks',
    mimeType: 'text/markdown',
  },
];

/**
 * Get resource content by URI
 */
export function getResourceContent(uri: string): string {
  switch (uri) {
    case 'osint://guide/getting-started':
      return `# Getting Started with OSINT Platform

## What is this platform?

The OSINT Intelligence Platform monitors Telegram channels for Ukraine-related intelligence, enriches content with AI analysis, and provides tools for investigation and validation.

## Key Concepts

### Messages
Telegram messages are the core data unit. Each message is enriched with:
- **AI Classification**: Importance level (high/medium/low) and topic
- **Entity Extraction**: People, organizations, equipment, locations mentioned
- **Embeddings**: 384-dim vectors for semantic search
- **Translation**: Automatic translation to English
- **Geolocation**: Coordinates extracted from content

### Channels
Telegram channels are organized by:
- **Folder**: Archive-UA (Ukrainian), Archive-RU (Russian), Monitor-*, etc.
- **Rule**: archive_all (save everything) or selective_archive (AI-filtered)
- **Affiliation**: ukraine, russia, neutral, unknown
- **Source Type**: state_media, military_unit, journalist, osint_aggregator

### Events
Events are clusters of messages about the same real-world incident:
- **Detection**: Velocity-based (message spikes) + semantic similarity
- **Verification**: Automatic tier progression as more sources report
- **Cross-reference**: Correlated with RSS news sources

## Quick Start Workflows

### 1. Search for Intelligence
\`\`\`
"Search for high-importance messages about [topic] from the last 7 days"
"Find messages similar to [description]"
"Search semantically for [concept]"
\`\`\`

### 2. Investigate an Entity
\`\`\`
"Investigate [person/organization name]"
"Find all mentions of [entity] and show relationships"
"Check if [name] is sanctioned"
\`\`\`

### 3. Validate a Claim
\`\`\`
"Validate message #[id] against news sources"
"Find RSS articles that confirm or contradict this claim"
"Show the event timeline for [topic]"
\`\`\`

### 4. Monitor the Platform
\`\`\`
"What's the platform health status?"
"Show data quality metrics"
"Check the processing queue"
\`\`\`

## Tips

1. **Use semantic search** for concepts ("military equipment losses")
2. **Use text search** for specific terms ("T-90M")
3. **Filter by importance=high** for analyst-relevant content
4. **Check event tiers** to assess verification level
5. **Cross-reference with RSS** for fact-checking`;

    case 'osint://reference/topics':
      return `# Topic Classification Reference

The platform uses 13 topic categories for message classification:

| Topic | Description | Examples |
|-------|-------------|----------|
| **combat** | Active fighting, strikes, battles | Artillery strikes, drone attacks, firefights |
| **equipment** | Military hardware | Tank sightings, weapon systems, vehicle convoys |
| **casualties** | Losses and injuries | KIA reports, wounded, POW exchanges |
| **movements** | Troop movements | Deployments, rotations, reinforcements |
| **infrastructure** | Damage to infrastructure | Bridges, power plants, railways |
| **humanitarian** | Civilian impact | Evacuations, aid delivery, refugees |
| **diplomatic** | Political developments | Negotiations, sanctions, statements |
| **intelligence** | OSINT/reconnaissance | Satellite imagery, intercepted comms |
| **propaganda** | Information operations | Narratives, disinformation, morale ops |
| **units** | Military unit information | Brigade deployments, command changes |
| **locations** | Geographic references | City status, territorial control |
| **general** | General war-related | Doesn't fit specific categories |
| **uncertain** | Classification uncertain | Ambiguous content |

## Using Topic Filters

\`\`\`
# Search by topic
search_messages(topic="combat", importance_level="high")

# Get topic distribution
get_topic_distribution(days=7)

# Multiple topics via unified search
unified_search(query="Bakhmut", types="messages")
\`\`\`

## Topic Assignment

Topics are assigned by the LLM classifier (qwen2.5) based on:
1. Content analysis
2. Entity types mentioned
3. Context from channel affiliation
4. Keyword patterns`;

    case 'osint://reference/event-tiers':
      return `# Event Verification Tiers

Events (message clusters) progress through verification tiers automatically:

## Tier Definitions

| Tier | Criteria | Confidence | Color |
|------|----------|------------|-------|
| **rumor** | Single channel reporting | Very Low | Red |
| **unconfirmed** | 2-3 channels, same affiliation | Low | Yellow |
| **confirmed** | 3+ channels, cross-affiliation | Medium | Orange |
| **verified** | Human-verified with evidence | High | Green |

## Automatic Progression

The system automatically promotes events when:

1. **rumor → unconfirmed**: Additional channels report (same affiliation)
2. **unconfirmed → confirmed**: Cross-affiliation reporting (e.g., both pro-UA and pro-RU sources)
3. **confirmed → verified**: Manual human verification (analyst action)

## Cross-Affiliation Requirement

For an event to reach "confirmed" tier:
- Must have reports from channels with DIFFERENT affiliations
- Example: Both a Ukrainian military channel AND a Russian news channel report the same strike

This prevents echo-chamber confirmation within a single information bubble.

## Event Detection

Events are detected via:
1. **Velocity Spike**: Sudden increase in messages about same topic/location
2. **Semantic Clustering**: Messages with similar embeddings (>0.80 similarity)
3. **Geographic Clustering**: Messages about same location within time window

## Using Event Tiers

\`\`\`
# List confirmed events only
list_events(tier_status="confirmed")

# Get event statistics by tier
get_event_stats()

# Check events for a message
get_events_for_message(message_id=12345)
\`\`\``;

    case 'osint://reference/entity-types':
      return `# Entity Types and Sources

## Entity Types

| Type | Description | Examples |
|------|-------------|----------|
| **person** | Individuals | Military commanders, politicians, journalists |
| **organization** | Groups/companies | Wagner Group, Rosatom, Red Cross |
| **military_unit** | Military formations | 72nd Mechanized Brigade, 1st Tank Army |
| **equipment** | Military hardware | T-90M, HIMARS, Bayraktar TB2 |
| **location** | Geographic places | Bakhmut, Zaporizhzhia NPP |
| **event** | Historical events | Bucha massacre, Kerch Bridge attack |
| **ship** | Naval vessels | Moskva cruiser, landing ships |
| **aircraft** | Aviation assets | Su-35, Ka-52, A-50 |
| **vehicle** | Ground vehicles | BTR-82A, BMP-3 |
| **weapon** | Weapon systems | Kalibr missiles, Shahed drones |
| **electronic_warfare** | EW systems | Krasukha, Pole-21 |
| **component** | Equipment parts | Targeting pods, radios |

## Entity Sources

### 1. Curated Entities (1,425+)
- Manually curated knowledge base
- High confidence matches
- Ukraine/Russia conflict specific
- Updated regularly

### 2. OpenSanctions (10,000+)
- Integrated via Yente API
- Sanctions lists: OFAC, EU, UK, UN
- PEP (Politically Exposed Persons)
- Corporate ownership data

### 3. Wikidata Enrichment
- Automatic profile enhancement
- Relationship graphs (employers, positions)
- Images and descriptions
- 7-day cache for performance

## Confidence Scores

| Extraction Method | Confidence | Symbol |
|-------------------|------------|--------|
| Dictionary match | 0.95-1.0 | Solid |
| NER extraction | 0.7-0.95 | ~ |
| Fuzzy match | 0.6-0.85 | ? |

## Using Entity Search

\`\`\`
# Search all sources
search_entities(query="Putin", source="all")

# Search OpenSanctions only
search_entities(query="Prigozhin", source="opensanctions")

# Get relationships
get_entity_relationships(source="curated", entity_id="Q12345")
\`\`\``;

    case 'osint://reference/channel-affiliations':
      return `# Channel Affiliations and Source Types

## Affiliations

| Affiliation | Description | Typical Sources |
|-------------|-------------|-----------------|
| **ukraine** | Pro-Ukrainian | Ukrainian military, govt, OSINT |
| **russia** | Pro-Russian | Russian state media, milbloggers |
| **neutral** | Balanced/Western | International media, NGOs |
| **unknown** | Not yet classified | New channels under evaluation |

## Source Types

| Type | Description | Reliability Notes |
|------|-------------|-------------------|
| **state_media** | Government-controlled | High volume, narrative-driven |
| **military_unit** | Official unit channels | Primary source for own operations |
| **military_official** | Individual officers | Insider perspective |
| **government_official** | Political figures | Policy/diplomatic focus |
| **journalist** | Independent reporters | Varied reliability |
| **osint_aggregator** | OSINT accounts | Secondary analysis |
| **news_aggregator** | News compilation | Multiple source coverage |
| **personality** | Influencers/bloggers | Opinion-heavy |
| **regional** | Local news | Ground-level detail |
| **militant** | Armed group channels | Self-reporting bias |

## Folder Organization

Channels are organized in Telegram folders:
- \`Archive-UA\` - Ukrainian sources, archive all
- \`Archive-RU\` - Russian sources, archive all
- \`Monitor-UA\` - Ukrainian, selective archive
- \`Monitor-RU\` - Russian, selective archive
- \`Discover-*\` - New channels under evaluation

## Cross-Affiliation Analysis

When analyzing events, cross-affiliation confirmation is key:
- Same event reported by both pro-UA and pro-RU = higher confidence
- Only single-affiliation = potential echo chamber
- Neutral sources can break ties

## Using Affiliation Filters

\`\`\`
# List Ukrainian channels
list_channels(folder="Archive-UA")

# Get channel stats by affiliation
get_channels_admin_stats()

# Filter messages by channel folder
search_messages(channel_folder="Archive-UA")
\`\`\``;

    case 'osint://reference/geolocation':
      return `# Geolocation Pipeline Reference

## 4-Stage Pipeline

Messages are geocoded through a 4-stage pipeline:

| Stage | Method | Confidence | Speed |
|-------|--------|------------|-------|
| 1. **Gazetteer** | Offline dictionary (30,000+ locations) | 0.95 | Fast |
| 2. **LLM Relative** | AI interpretation ("10km north of X") | 0.75 | Medium |
| 3. **Nominatim** | OpenStreetMap API lookup | 0.85 | Slow |
| 4. **Unresolved** | Manual review queue | - | Manual |

## Stage Details

### Stage 1: Gazetteer Match
- 30,000+ UA/RU locations from GeoNames
- Exact name matching with variants
- Fastest and most reliable
- Includes: cities, villages, oblasts, landmarks

### Stage 2: LLM Relative Location
- Handles relative descriptions: "near Bakhmut", "10km east of Kherson"
- Uses reference point + direction/distance
- Lower confidence due to interpretation

### Stage 3: Nominatim API
- OpenStreetMap geocoding service
- Handles addresses and POIs
- Rate-limited, used as fallback

### Stage 4: Unresolved Queue
- Messages that couldn't be geocoded
- Flagged for manual review
- May contain novel or misspelled locations

## Location Types

| Type | Description |
|------|-------------|
| **point** | Single location |
| **origin** | Movement start point |
| **destination** | Movement end point |
| **waypoint** | Intermediate point |

## Coordinate Systems

- **Database**: (latitude, longitude) - standard
- **GeoJSON**: [longitude, latitude] - reversed!
- **Bounding Box**: "minLng,minLat,maxLng,maxLat"

## Using Geolocation

\`\`\`
# Suggest locations (autocomplete)
suggest_locations(query="Bakhmut")

# Reverse geocode coordinates
reverse_geocode(lat=48.5953, lng=37.9997)

# Get map messages in area
get_map_messages(bounds="37.5,48.0,38.5,49.0")

# Get event clusters on map
get_map_clusters(tier_status="confirmed")
\`\`\``;

    case 'osint://workflows/investigation':
      return `# Investigation Workflows

## Workflow 1: Entity Investigation

\`\`\`mermaid
graph TD
    A[Start: Entity Name] --> B[search_entities]
    B --> C{Found?}
    C -->|Yes| D[get_entity]
    C -->|No| E[Try fuzzy search / OpenSanctions]
    D --> F[get_entity_relationships]
    F --> G[get_entity_mentions]
    G --> H[Analyze patterns]
\`\`\`

### Steps:
1. \`search_entities(query="Name", source="all")\`
2. \`get_entity(source, entity_id)\`
3. \`get_entity_relationships(source, entity_id)\`
4. \`get_entity_mentions(source, entity_id, limit=20)\`
5. Analyze mention frequency, co-occurring entities, channels

## Workflow 2: Claim Validation

\`\`\`mermaid
graph TD
    A[Start: Message ID] --> B[get_message]
    B --> C[validate_message]
    C --> D{Validation Result}
    D -->|Confirms| E[High confidence]
    D -->|Contradicts| F[Flag for review]
    D -->|None| G[get_events_for_message]
    G --> H[Check event tier]
\`\`\`

### Steps:
1. \`get_message(message_id)\` - Get full content
2. \`validate_message(message_id)\` - Cross-reference RSS
3. \`get_message_correlations(message_id)\` - Find related articles
4. \`get_events_for_message(message_id)\` - Check event context
5. Assess: validation status + event tier = confidence level

## Workflow 3: Narrative Tracing

\`\`\`mermaid
graph TD
    A[Start: Narrative] --> B[semantic_search]
    B --> C[Find earliest instance]
    C --> D[get_message_social_graph]
    D --> E[Track forward chain]
    E --> F[find_similar_messages]
    F --> G[Map propagation]
\`\`\`

### Steps:
1. \`semantic_search(query="narrative description")\`
2. Sort by date, find origin
3. \`get_message_social_graph(message_id)\` - Get forward chain
4. \`find_similar_messages(message_id)\` - Find variations
5. \`get_engagement_timeline(message_id)\` - Track virality
6. Analyze: timing, channels, cross-affiliation spread

## Workflow 4: Geographic Analysis

\`\`\`mermaid
graph TD
    A[Start: Location] --> B[suggest_locations]
    B --> C[Get coordinates/bounds]
    C --> D[get_map_messages]
    D --> E[get_map_clusters]
    E --> F[get_map_heatmap]
    F --> G[Analyze patterns]
\`\`\`

### Steps:
1. \`suggest_locations(query="location name")\`
2. Extract coordinates or define bounding box
3. \`get_map_messages(bounds, days=7)\`
4. \`get_map_clusters(bounds)\` - Event locations
5. \`get_map_heatmap(bounds)\` - Activity density
6. Analyze: hotspots, event clusters, temporal patterns

## Workflow 5: Channel Analysis

\`\`\`mermaid
graph TD
    A[Start: Channel] --> B[get_channel]
    B --> C[get_channel_stats]
    C --> D[get_channel_influence]
    D --> E[get_channel_network]
    E --> F[search_messages high importance]
\`\`\`

### Steps:
1. \`get_channel(channel_id)\` - Basic info
2. \`get_channel_stats(channel_id)\` - Volume, topics
3. \`get_channel_influence(channel_id)\` - Forward relationships
4. \`get_channel_network(channel_id)\` - Content clusters
5. \`search_messages(channel_id, importance_level="high", days=30)\`
6. Assess: reliability, influence, content patterns`;

    default:
      return `Resource not found: ${uri}`;
  }
}
