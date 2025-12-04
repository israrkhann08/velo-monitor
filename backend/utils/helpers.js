const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const parseMetricsResponse = (resp) => {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (resp.metrics) return resp.metrics;
  return [];
};

const buildKeyFromLink = (link = {}) =>
  link.internalId || link.logicalId || (link.id !== undefined ? String(link.id) : `${link.interface}`);

const parseIsoToDate = (iso) => (iso ? new Date(iso) : null);

function chooseLatestMetricRecord(records) {
  if (!records || !records.length) return null;
  let best = records[0];
  let bestDate = parseIsoToDate(best?.link?.modified || best?.link?.lastActive || best?.link?.created) || new Date(0);
  for (const r of records) {
    const d = parseIsoToDate(r?.link?.modified || r?.link?.lastActive || r?.link?.created) || new Date(0);
    if (d > bestDate) {
      best = r;
      bestDate = d;
    }
  }
  return best;
}

function classifyEdge(edgeObj) {
  const edgeState = (edgeObj.edge_state || "UNKNOWN").toUpperCase();
  const links = edgeObj.links || [];
  const stableLinkStates = new Set(["UP", "CONNECTED", "STABLE", "ACTIVE"]);

  if (edgeState === 'OFFLINE' || links.length === 0) return "offline";

  const allLinksStable = links.every(link => {
    const linkState = (link.state || "").toUpperCase();
    return stableLinkStates.has(linkState);
  });

  if (edgeState === 'DEGRADED') return "partial";
  if (edgeState === 'CONNECTED' && !allLinksStable) return "partial";
  if (edgeState === 'CONNECTED' && allLinksStable) return "connected";

  return "offline";
}

module.exports = {
  sleep,
  parseMetricsResponse,
  buildKeyFromLink,
  chooseLatestMetricRecord,
  classifyEdge,
  parseIsoToDate
};