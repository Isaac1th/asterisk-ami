// Socket.IO connection handling
const { parsePjsipEndpointList } = require("../ami/parsers");

function setupSocket(io, ami, state) {
  io.on("connection", (socket) => {
    console.log("Browser connected");

    // Send current AMI connection status
    socket.emit("ami_status", { connected: ami.connected });

    // Send current state to new connections
    socket.emit("initial_state", {
      calls: state.getAllCalls(),
      peers: state.getAllPeers(),
    });

    // Handle request to refresh data
    socket.on("refresh", () => {
      console.log("Refresh requested");
      ami.action({ action: "SIPpeers" });
      ami.action({ action: "CoreShowChannels" });

      // Refresh PJSIP endpoints
      ami.action(
        { action: "Command", command: "pjsip list endpoints like ^[0-9]" },
        (err, res) => {
          if (!err && res) {
            const output =
              res.output || res.content || res.$content || res.message;
            if (output) {
              parsePjsipEndpointList(output, state, io);
            }
          }
        },
      );
    });

    socket.on("disconnect", () => {
      console.log("Browser disconnected");
    });
  });
}

module.exports = { setupSocket };
