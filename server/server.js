// Entry point - bootstrap and wire modules
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const config = require("./config");
const state = require("./state");
const { createLogger } = require("./utils/logger");
const log = createLogger("Server");
const { setupAmi } = require("./ami");
const { setupSocket } = require("./socket");
const { setupRoutes } = require("./routes");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Initialize modules
const ami = setupAmi(io, state);
setupSocket(io, ami, state);
setupRoutes(app, ami, state);

server.listen(config.PORT, () => {
  log.info(`Dashboard running at http://localhost:${config.PORT}`);
  log.info(`Health check at http://localhost:${config.PORT}/health`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  log.info("Shutting down...");
  ami.disconnect();
  server.close();
  process.exit();
});

// Process-level error handlers to prevent silent crashes
process.on("uncaughtException", (err) => {
  log.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  log.error("Unhandled rejection:", reason);
});
