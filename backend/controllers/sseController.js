const sseService = require("../services/sseService");
const edgeService = require("../services/edgeService");

const handleSseConnection = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = sseService.addClient(res);

  // Send immediate initial data if available
  const currentData = edgeService.getCachedData();
  if (currentData) {
    res.write(`data: ${JSON.stringify(currentData)}\n\n`);
  }

  req.on('close', () => {
    sseService.removeClient(clientId);
  });
};

module.exports = { handleSseConnection };