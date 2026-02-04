// CLI output parsers for AMI responses
const { createLogger } = require("../utils/logger");
const log = createLogger("AMI-Parsers");

function parsePjsipEndpointList(output, state, io) {
  const lines = Array.isArray(output) ? output : output.split("\n");

  lines.forEach((line) => {
    // Match lines like " Endpoint:  501/501    Not in use    0 of inf"
    // or trunk lines like " Endpoint:  trunk-name    Not in use    0 of inf"
    // Format: Endpoint:  <endpoint>[/CID]  <state>  <channels> of inf
    const match = line.match(
      /Endpoint:\s+([^\s/]+)(?:\/\S+)?\s+(Not in use|Unavailable|In use|Busy|Ringing|Idle)\s+/i,
    );
    if (match) {
      const endpoint = match[1];
      const status = match[2];
      const peerData = {
        peer: "PJSIP/" + endpoint,
        status: status,
        address: "pjsip",
      };
      state.setPeer(peerData.peer, peerData);
      io.emit("peer_update", peerData);
    }
  });

  log.debug("[PJSIP CLI] Total peers:", Object.keys(state.peers).length);
}

module.exports = { parsePjsipEndpointList };
