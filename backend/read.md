VeloCloud Edge Monitoring Backend
1. Project Overview
This is a Node.js/Express backend service designed to monitor VMware VeloCloud SD-WAN Edges. It acts as a middleware between a frontend dashboard and the VeloCloud Orchestrator (VCO) API.
Key Features:
Real-time Updates: Uses Server-Sent Events (SSE) to push updates to the frontend immediately after polling.
Intelligent Caching: Implements a strategy to fetch real-time metrics frequently (e.g., every 30s) while caching historical data (last 30 days) for 24 hours to reduce API load.
Concurrency Control: Uses a worker queue pattern to fetch data for multiple edges in parallel without overwhelming the VCO API.
Data Aggregation: Automatically classifies Edge health (Connected, Partial, Offline) and aggregates ISP performance statistics.
2. Folder Structure
code
Text
backend/
├── config/              # Configuration and Environment variable management
├── controllers/         # Request handlers for API routes
├── routes/              # API Route definitions
├── services/            # Core business logic (Fetching, Caching, SSE)
├── utils/               # Helper functions and Axios client setup
├── .env                 # Environment variables (Sensitive data)
├── server.js            # Application Entry Point
└── package.json         # Dependencies and scripts
3. Configuration & Setup
Environment Variables (.env)
Create a .env file in the root directory with the following variables:
Variable	Description	Default
PORT	Server listening port	3000
VCO_URL	URL of the VeloCloud Orchestrator	https://vco84-usvi1.velocloud.net
API_TOKEN	Authentication token for VCO API	Required
ENTERPRISE_ID	The specific Enterprise ID to monitor	0
POLL_INTERVAL_MS	How often to fetch fresh data (in ms)	30000 (30s)
MAX_WORKERS	Max concurrent requests to VCO API	4
TIMEOUT_MS	API Request timeout	20000
Installation
Install dependencies:
code
Bash
npm install
Start the server:
code
Bash
node server.js
4. API Endpoints
1. Get All Edges (REST)
Returns the current cached snapshot of all edges.
Endpoint: GET /api/edges
Response: JSON Object containing metadata, edge list, and analytics.
Status Codes:
200: Success.
503: Service initializing (Data not ready yet).
2. Real-time Stream (SSE)
Opens a persistent connection for real-time updates.
Endpoint: GET /events
Headers: Content-Type: text/event-stream
Behavior: Pushes the full data payload every time the background polling cycle completes.
5. Architectural Breakdown
A. The Polling Engine (services/edgeService.js)
This is the core of the application. It runs on a timer defined by POLL_INTERVAL_MS.
Orchestrator (pollAndUpdate):
Fetches the list of all edges from VCO.
Passes the list to processAllEdges.
Calculates aggregate stats (Total, Connected, Offline).
Generates ISP Analytics.
Broadcasts the result via SSE.
Worker Pattern (processAllEdges):
Instead of fetching all edges at once (which would time out) or one by one (which is too slow), it uses a Worker Queue.
MAX_WORKERS determines how many parallel requests are sent to the VCO API at once.
Data Processing (processSingleEdge):
Current Metrics: Fetches metrics for the last 15 minutes.
Historical Metrics: Fetches metrics for the last 30 days.
Optimization: Historical data is heavy. The service caches 30-day history in memory (historyCache) for 24 hours (HISTORY_TTL_MS) so it doesn't re-fetch it on every poll cycle.
Merge Logic: Merges recent link activity with historical link data to provide a complete view of interfaces (even those currently down).
B. ISP Analytics (services/edgeService.js -> generateIspAnalytics)
The system analyzes the link data to generate statistics about Internet Service Providers.
Normalization: It groups variations of names (e.g., "PTCL Fiber", "PTCL DSL" -> "PTCL").
Stability Check: Calculates "Stable" vs "Unstable" counts based on link states (UP, CONNECTED, STABLE, ACTIVE).
Sorting: Returns ISPs sorted by total usage count.
C. Edge Classification (utils/helpers.js)
Determines the color/status of an edge:
Offline: Edge State is 'OFFLINE' or has no links.
Partial: Edge is 'DEGRADED' OR Edge is 'CONNECTED' but has at least one unstable link.
Connected: Edge is 'CONNECTED' and all links are stable.
D. Server-Sent Events (services/sseService.js)
Manages a list of active clients.
When edgeService finishes a poll, it calls sseService.broadcast(data).
All connected frontends receive the update simultaneously.
6. Code Walkthrough by File
File	Functionality
server.js	initializes Express, starts the HTTP server, and triggers the setInterval loop for edgeService.pollAndUpdate.
config/index.js	Centralizes configuration. Handles defaults for environment variables.
controllers/edgeController.js	Simple controller. Returns globalCachedData if it exists, otherwise returns a 503 error.
controllers/sseController.js	Sets necessary HTTP headers for SSE (keep-alive, no-cache). Sends immediate data upon connection so the UI doesn't wait for the next poll cycle.
services/veloApi.js	A wrapper around axios. Contains specific VCO API paths (/portal/rest/...).
utils/apiClient.js	Creates the Axios instance with the specific VeloCloud Authentication Header (Authorization: Token ...).
7. Data Model (Response Structure)
The API and SSE will return a JSON object structured as follows:
code
JSON
{
  "meta": {
    "total": 50,
    "connected": 45,
    "partial": 2,
    "offline": 3,
    "fetchedAt": "2023-10-27T10:00:00.000Z"
  },
  "edges": [
    {
      "edge_id": 101,
      "edge_name": "Branch-Office-01",
      "edge_state": "CONNECTED",
      "classification": "connected",
      "links": [
        {
          "interface": "GE1",
          "isp": "PTCL",
          "state": "STABLE",
          "lastActive": "2023-10-27T09:59:00.000Z"
        }
      ]
    }
    // ... more edges
  ],
  "analytics": {
    "ispStats": [
      { "name": "PTCL", "total": 20, "stable": 18, "unstable": 2 },
      { "name": "NAYATEL", "total": 10, "stable": 10, "unstable": 0 }
    ]
  }
}
8. Troubleshooting / Notes
Rate Limiting (429):
The .env suggests logic for AFTER_429_PAUSE_MS, though the retry logic itself seems to be implicit in the provided snippets (or intended for utils/apiClient.js). Ensure the API token has sufficient quota.
Memory Usage:
The historyCache stores 30 days of metrics for every edge. For a very large enterprise (thousands of edges), Node.js memory usage should be monitored.
Startup Time:
The first request to /api/edges will fail (503) until the first polling cycle (defined by POLL_INTERVAL_MS) completes. The console will log "Starting background polling...".