const veloApi = require("./veloApi");
const sseService = require("./sseService");
const config = require("../config");
const helpers = require("../utils/helpers");

// In-memory store
let globalCachedData = null;
const historyCache = {};

// --- Logic for a single edge ---
async function processSingleEdge(edge, nowMs) {
  const edgeId = edge.id;
  const edgeName = edge.name || `edge-${edgeId}`;
  const edgeState = edge.edgeState || "UNKNOWN";

  // 1. Current Metrics
  let currentMetrics = [];
  try {
    const curResp = await veloApi.getEdgeLinkMetrics(edgeId, nowMs - 15 * 60 * 1000, nowMs);
    currentMetrics = helpers.parseMetricsResponse(curResp);
  } catch { currentMetrics = []; }

  // 2. History Metrics (Cached)
  let historyMetrics = [];
  const cachedHist = historyCache[edgeId];
  
  if (cachedHist && nowMs - cachedHist.lastFetched < config.HISTORY_TTL_MS) {
    historyMetrics = cachedHist.data;
  } else {
    try {
      // Fetch 30 days history
      const histResp = await veloApi.getEdgeLinkMetrics(edgeId, nowMs - 30 * 24 * 60 * 60 * 1000, nowMs);
      historyMetrics = helpers.parseMetricsResponse(histResp);
      historyCache[edgeId] = { lastFetched: nowMs, data: historyMetrics };
    } catch {
      historyMetrics = cachedHist?.data || [];
    }
  }

  // 3. Merge Logic
  const currentMap = {};
  for (const rec of currentMetrics) {
    currentMap[helpers.buildKeyFromLink(rec.link)] = { record: rec, is_historical: false };
  }

  const historyMap = {};
  for (const rec of historyMetrics) {
    const key = helpers.buildKeyFromLink(rec.link);
    if (!currentMap[key]) {
      historyMap[key] = { record: helpers.chooseLatestMetricRecord([rec]), is_historical: true };
    }
  }

  const mergedMap = { ...currentMap, ...historyMap };
  const rows = Object.entries(mergedMap).map(([key, info]) => {
    const rec = info.record;
    const link = rec.link || {};
    return {
      key,
      interface: link.interface || "N/A",
      isp: link.isp || link.displayName || "Unknown ISP",
      state: link.state || "UNKNOWN",
      lastActive: link.lastActive || rec.lastActive || "",
      lastEvent: link.lastEvent || rec.lastEvent || "",
      is_historical: info.is_historical,
      raw: rec,
    };
  });

  return {
    edge_id: edgeId,
    edge_name: edgeName,
    edge_state: edgeState,
    link_count: rows.length,
    links: rows,
    classification: helpers.classifyEdge({ edge_state: edgeState, links: rows }),
  };
}

// --- Worker Queue Pattern ---
async function processAllEdges(edgesList) {
  const results = [];
  const queue = [...edgesList];
  const workers = Math.min(queue.length, config.MAX_WORKERS);
  
  const promises = new Array(workers).fill(null).map(async () => {
    while (queue.length) {
      const edge = queue.shift();
      try {
        const r = await processSingleEdge(edge, Date.now());
        results.push(r);
      } catch (e) { /* silent fail */ }
    }
  });
  
  await Promise.all(promises);
  return results;
}

// --- ISP Aggregation Logic (New) ---
function generateIspAnalytics(edges) {
  const ispStats = {};

  edges.forEach(edge => {
    edge.links.forEach(link => {
      // Normalize ISP name (remove special chars, uppercase)
      let ispName = (link.isp || "Unknown").toUpperCase().trim();
      
      // Group similar names (optional simple cleaning)
      if(ispName.includes("PTCL")) ispName = "PTCL";
      if(ispName.includes("NAYATEL")) ispName = "NAYATEL";
      if(ispName.includes("STORM")) ispName = "STORMFIBER";
      if(ispName.includes("WATEEN")) ispName = "WATEEN";
      if(ispName.includes("JAZZ")) ispName = "JAZZ";
      if(ispName.includes("ZONG")) ispName = "ZONG";

      if (!ispStats[ispName]) {
        ispStats[ispName] = { name: ispName, total: 0, stable: 0, unstable: 0 };
      }

      ispStats[ispName].total++;
      
      const isStable = ["UP", "CONNECTED", "STABLE", "ACTIVE"].includes((link.state || "").toUpperCase());
      if (isStable) {
        ispStats[ispName].stable++;
      } else {
        ispStats[ispName].unstable++;
      }
    });
  });

  // Convert to array and sort by usage
  return Object.values(ispStats).sort((a, b) => b.total - a.total);
}

// --- Main Polling Orchestrator ---
async function pollAndUpdate() {
  try {
    const edgesRaw = await veloApi.getEnterpriseEdges();
    let edgesList = Array.isArray(edgesRaw) ? edgesRaw : edgesRaw?.edges || [];
    edgesList = edgesList.filter((e) => e?.id);

    const results = await processAllEdges(edgesList);

    const total = results.length;
    const connected = results.filter((r) => r.classification === "connected").length;
    const partial = results.filter((r) => r.classification === "partial").length;
    const offline = results.filter((r) => r.classification === "offline").length;

    // Generate Analytics
    const ispAnalytics = generateIspAnalytics(results);

    const payload = {
      meta: { total, connected, partial, offline, fetchedAt: new Date().toISOString() },
      edges: results,
      analytics: {
        ispStats: ispAnalytics
      }
    };

    globalCachedData = payload;
    sseService.broadcast(payload); 

  } catch (err) {
    console.error("Polling error:", err?.message || err);
  }
}

function getCachedData() {
  return globalCachedData;
}

module.exports = { pollAndUpdate, getCachedData };