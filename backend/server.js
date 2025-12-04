const express = require("express");
const config = require("./config");
const apiRoutes = require("./routes/apiRoutes");
const edgeService = require("./services/edgeService");

const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Routes
app.use("/", apiRoutes);

// Start Server
app.listen(config.PORT, () => {
  console.log(`Server running at http://localhost:${config.PORT}`);
  
  // Initialize Background Polling
  console.log("Starting background polling...");
  edgeService.pollAndUpdate(); 
  setInterval(edgeService.pollAndUpdate, config.POLL_INTERVAL_MS);
});