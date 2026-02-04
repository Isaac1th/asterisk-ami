// AMI connection lifecycle
const AsteriskManager = require("asterisk-manager");
const config = require("../config");
const { registerHandlers } = require("./handlers");
const { parsePjsipEndpointList } = require("./parsers");
const { sanitizeEvent } = require("../utils/sanitize");
const { createLogger } = require("../utils/logger");

const log = createLogger("AMI");

function setupAmi(io, state) {
  let hasConnectedBefore = false;

  const ami = new AsteriskManager(
    config.AMI_PORT,
    config.AMI_HOST,
    config.AMI_USER,
    config.AMI_PASS,
    true,
  );

  // Debug: Log and emit sanitized events (only in development or if explicitly enabled)
  ami.on("managerevent", (evt) => {
    if (config.DEBUG_EVENTS) {
      const sanitized = sanitizeEvent(evt);
      log.debug(`Event ${evt.event}`, sanitized);
      io.emit("debug_event", sanitized);
    }
  });

  ami.on("connect", () => {
    if (hasConnectedBefore) {
      log.info("Reconnected to Asterisk AMI");
    } else {
      log.info("Connected to Asterisk AMI");
      hasConnectedBefore = true;
    }
    state.setAmiConnected(true);
    io.emit("ami_status", { connected: true });

    // Enable ALL events
    ami.action({ action: "Events", eventmask: "on" }, (err, res) => {
      if (err) {
        log.error("Failed to enable events", err);
      } else {
        log.debug("Events enabled", res);
      }
    });

    // Fetch initial data
    fetchInitialData(ami, state, io);
  });

  ami.on("close", () => {
    log.warn("AMI connection closed");
    state.setAmiConnected(false);
    io.emit("ami_status", { connected: false });

    // Clear stale call data — active calls are no longer valid
    const staleCount = Object.keys(state.activeCalls).length;
    if (staleCount > 0) {
      log.info(`Clearing ${staleCount} stale active call(s)`);
      for (const uniqueid of Object.keys(state.activeCalls)) {
        state.deleteCall(uniqueid);
      }
      io.emit("initial_state", {
        calls: [],
        peers: state.getAllPeers(),
      });
    }
  });

  ami.on("error", (err) => {
    log.error("AMI error", err);
    state.setAmiConnected(false);
    io.emit("ami_status", { connected: false, error: err.message });
  });

  // Register all event handlers
  registerHandlers(ami, io, state);

  // Auto-reconnect on connection loss with exponential backoff
  ami.keepConnected();

  return ami;
}

function fetchInitialData(ami, state, io) {
  // Fetch SIP peers
  log.debug("Fetching initial SIP peers...");
  ami.action({ action: "SIPpeers" }, (err) => {
    try {
      if (err) log.error("SIPpeers error", err);
      else log.debug("SIPpeers request sent");
    } catch (e) {
      log.error("Error handling SIPpeers response", e);
    }
  });

  // Fetch PJSIP endpoints
  ami.action(
    { action: "Command", command: "pjsip list endpoints like ^[0-9]" },
    (err, res) => {
      try {
        if (err) {
          log.error("PJSIP list endpoints error", err);
        } else {
          log.debug("PJSIP list endpoints response", res);
          const output =
            res.output || res.content || res.$content || res.message;
          if (output) {
            parsePjsipEndpointList(output, state, io);
          } else {
            log.warn("No output found in PJSIP response", { keys: Object.keys(res || {}) });
          }
        }
      } catch (e) {
        log.error("Error handling PJSIP endpoints response", e);
      }
    },
  );

  // Fetch active channels
  log.debug("Fetching active channels...");
  ami.action({ action: "CoreShowChannels" }, (err) => {
    try {
      if (err) log.error("CoreShowChannels error", err);
      else log.debug("CoreShowChannels request sent");
    } catch (e) {
      log.error("Error handling CoreShowChannels response", e);
    }
  });
}

module.exports = { setupAmi, fetchInitialData };
