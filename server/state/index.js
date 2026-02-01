// Shared state management
const activeCalls = {};
const peers = {};

module.exports = {
  // Raw state objects (for direct access when needed)
  activeCalls,
  peers,

  // Active calls helpers
  getCall: (uniqueid) => activeCalls[uniqueid],
  setCall: (uniqueid, data) => {
    activeCalls[uniqueid] = data;
  },
  updateCall: (uniqueid, updates) => {
    if (activeCalls[uniqueid]) {
      Object.assign(activeCalls[uniqueid], updates);
    }
  },
  deleteCall: (uniqueid) => {
    delete activeCalls[uniqueid];
  },
  getAllCalls: () => Object.values(activeCalls),

  // Peers helpers
  getPeer: (peer) => peers[peer],
  setPeer: (peer, data) => {
    const existing = peers[peer];
    // Track when status changed
    if (!existing || existing.status !== data.status) {
      data.statusSince = Date.now();
    } else {
      data.statusSince = existing.statusSince || Date.now();
    }
    peers[peer] = data;
  },
  getAllPeers: () => Object.values(peers),

  // Stats
  getStats: () => ({
    active_calls: Object.keys(activeCalls).length,
    peers: Object.keys(peers).length,
  }),
};
