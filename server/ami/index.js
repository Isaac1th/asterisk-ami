// AMI connection lifecycle
const AsteriskManager = require("asterisk-manager");
const config = require("../config");
const { registerHandlers } = require("./handlers");
const { parsePjsipEndpointList } = require("./parsers");

function setupAmi(io, state) {
  let hasConnectedBefore = false;

  const ami = new AsteriskManager(
    config.AMI_PORT,
    config.AMI_HOST,
    config.AMI_USER,
    config.AMI_PASS,
    true,
  );

  // Debug: Log ALL events coming from AMI
  ami.on("managerevent", (evt) => {
    console.log(`[AMI Event] ${evt.event}:`, JSON.stringify(evt, null, 2));
    io.emit("debug_event", evt);
  });

  ami.on("connect", () => {
    if (hasConnectedBefore) {
      console.log("Reconnected to Asterisk AMI");
    } else {
      console.log("Connected to Asterisk AMI");
      hasConnectedBefore = true;
    }
    state.setAmiConnected(true);
    io.emit("ami_status", { connected: true });

    // Enable ALL events
    ami.action({ action: "Events", eventmask: "on" }, (err, res) => {
      if (err) {
        console.log("Failed to enable events:", err);
      } else {
        console.log("Events enabled:", res);
      }
    });

    // Fetch initial data
    fetchInitialData(ami, state, io);
  });

  ami.on("close", () => {
    console.log("AMI connection closed");
    state.setAmiConnected(false);
    io.emit("ami_status", { connected: false });

    // Clear stale call data — active calls are no longer valid
    const staleCount = Object.keys(state.activeCalls).length;
    if (staleCount > 0) {
      console.log(`Clearing ${staleCount} stale active call(s)`);
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
    console.log("AMI Error:", err);
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
  console.log("Fetching initial SIP peers...");
  ami.action({ action: "SIPpeers" }, (err) => {
    try {
      if (err) console.log("SIPpeers error:", err);
      else console.log("SIPpeers request sent");
    } catch (e) {
      console.error("Error handling SIPpeers response:", e);
    }
  });

  // Fetch PJSIP endpoints
  ami.action(
    { action: "Command", command: "pjsip list endpoints like ^[0-9]" },
    (err, res) => {
      try {
        if (err) {
          console.log("PJSIP list endpoints error:", err);
        } else {
          console.log(
            "PJSIP list endpoints response:",
            JSON.stringify(res, null, 2),
          );
          const output =
            res.output || res.content || res.$content || res.message;
          if (output) {
            parsePjsipEndpointList(output, state, io);
          } else {
            console.log(
              "No output found in response. Keys:",
              Object.keys(res || {}),
            );
          }
        }
      } catch (e) {
        console.error("Error handling PJSIP endpoints response:", e);
      }
    },
  );

  // Fetch active channels
  console.log("Fetching active channels...");
  ami.action({ action: "CoreShowChannels" }, (err) => {
    try {
      if (err) console.log("CoreShowChannels error:", err);
      else console.log("CoreShowChannels request sent");
    } catch (e) {
      console.error("Error handling CoreShowChannels response:", e);
    }
  });
}

module.exports = { setupAmi, fetchInitialData };
