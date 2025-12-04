const edgeService = require("../services/edgeService");

const getEdges = (req, res) => {
  const data = edgeService.getCachedData();
  if (data) {
    return res.json(data);
  }
  res.status(503).json({ error: "Data not ready. System initializing." });
};

module.exports = { getEdges };