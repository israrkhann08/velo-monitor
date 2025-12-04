const axiosInstance = require("../utils/apiClient");
const config = require("../config");

async function postJson(path, payload) {
  const resp = await axiosInstance.post(path, payload);
  return resp.data;
}

async function getEnterpriseEdges() {
  return postJson("/portal/rest/enterprise/getEnterpriseEdges", { enterpriseId: config.ENTERPRISE_ID });
}

async function getEdgeLinkMetrics(edgeId, startMs, endMs) {
  return postJson("/portal/rest/metrics/getEdgeLinkMetrics", {
    enterpriseId: config.ENTERPRISE_ID,
    edgeId,
    interval: { start: startMs, end: endMs },
  });
}

module.exports = { getEnterpriseEdges, getEdgeLinkMetrics };