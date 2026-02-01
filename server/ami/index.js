// AMI connection lifecycle
const AsteriskManager = require("asterisk-manager");
const config = require("../config");
const { registerHandlers } = require("./handlers");
const { parsePjsipEndpointList } = require("./parsers");

function setupAmi(io, state) {
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
    console.log("Connected to Asterisk AMI");
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
    io.emit("ami_status", { connected: false });
  });

  ami.on("error", (err) => {
    console.log("AMI Error:", err);
    io.emit("ami_status", { connected: false, error: err.message });
  });

  // Register all event handlers
  registerHandlers(ami, io, state);

  return ami;
}

function fetchInitialData(ami, state, io) {
  // Fetch SIP peers
  console.log("Fetching initial SIP peers...");
  ami.action({ action: "SIPpeers" }, (err) => {
    if (err) console.log("SIPpeers error:", err);
    else console.log("SIPpeers request sent");
  });

  // Fetch PJSIP endpoints
  ami.action(
    { action: "Command", command: "pjsip list endpoints like ^[0-9]" },
    (err, res) => {
      if (err) {
        console.log("PJSIP list endpoints error:", err);
      } else {
        console.log(
          "PJSIP list endpoints response:",
          JSON.stringify(res, null, 2),
        );
        const output = res.output || res.content || res.$content || res.message;
        if (output) {
          parsePjsipEndpointList(output, state, io);
        } else {
          console.log(
            "No output found in response. Keys:",
            Object.keys(res || {}),
          );
        }
      }
    },
  );

  // Fetch active channels
  console.log("Fetching active channels...");
  ami.action({ action: "CoreShowChannels" }, (err) => {
    if (err) console.log("CoreShowChannels error:", err);
    else console.log("CoreShowChannels request sent");
  });
}

module.exports = { setupAmi, fetchInitialData };
