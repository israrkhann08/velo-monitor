const express = require("express");
const router = express.Router();
const edgeController = require("../controllers/edgeController");
const sseController = require("../controllers/sseController");

// Standard API
router.get("/api/edges", edgeController.getEdges);

// SSE Endpoint
router.get("/events", sseController.handleSseConnection);

module.exports = router;