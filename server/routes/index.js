// Express route definitions
const path = require("path");
const fs = require("fs");

function setupRoutes(app, ami, state) {
  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      server: "running",
      ami_connected: ami.connected,
      ...state.getStats(),
    });
  });

  // In production, serve the built React app
  const clientDistPath = path.join(__dirname, "..", "..", "client", "dist");
  if (fs.existsSync(clientDistPath)) {
    const express = require("express");
    app.use(express.static(clientDistPath));

    // Serve index.html for all non-API routes (SPA support)
    app.get("/{*splat}", (req, res) => {
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  // Error-handling middleware (must be registered last)
  app.use((err, req, res, next) => {
    console.error("Express error:", err);
    res.status(500).json({ error: "Internal server error" });
  });
}

module.exports = { setupRoutes };
