describe("state module", () => {
  let state;

  beforeEach(() => {
    // Reset modules to get fresh state for each test
    jest.resetModules();
    state = require("../state");

    // Clear any existing data
    Object.keys(state.activeCalls).forEach((key) => delete state.activeCalls[key]);
    Object.keys(state.peers).forEach((key) => delete state.peers[key]);
    state.setAmiConnected(false);
  });

  describe("call management", () => {
    it("should set and get a call", () => {
      const callData = {
        channel: "PJSIP/1001-00000001",
        callerid: "5551234567",
        state: "Ringing",
      };

      state.setCall("12345.001", callData);
      const retrieved = state.getCall("12345.001");

      expect(retrieved).toEqual(callData);
    });

    it("should return undefined for non-existent call", () => {
      expect(state.getCall("nonexistent")).toBeUndefined();
    });

    it("should update an existing call", () => {
      state.setCall("12345.001", { state: "Ringing", channel: "test" });
      state.updateCall("12345.001", { state: "Up", duration: 10 });

      const call = state.getCall("12345.001");
      expect(call.state).toBe("Up");
      expect(call.duration).toBe(10);
      expect(call.channel).toBe("test");
    });

    it("should not update non-existent call", () => {
      state.updateCall("nonexistent", { state: "Up" });
      expect(state.getCall("nonexistent")).toBeUndefined();
    });

    it("should delete a call", () => {
      state.setCall("12345.001", { channel: "test" });
      state.deleteCall("12345.001");

      expect(state.getCall("12345.001")).toBeUndefined();
    });

    it("should get all calls as array", () => {
      state.setCall("12345.001", { id: 1 });
      state.setCall("12345.002", { id: 2 });
      state.setCall("12345.003", { id: 3 });

      const calls = state.getAllCalls();

      expect(Array.isArray(calls)).toBe(true);
      expect(calls.length).toBe(3);
    });
  });

  describe("peer management", () => {
    it("should set and get a peer", () => {
      const peerData = {
        peer: "PJSIP/1001",
        status: "Reachable",
        address: "192.168.1.100",
      };

      state.setPeer("PJSIP/1001", peerData);
      const retrieved = state.getPeer("PJSIP/1001");

      expect(retrieved.peer).toBe("PJSIP/1001");
      expect(retrieved.status).toBe("Reachable");
      expect(retrieved.statusSince).toBeDefined();
    });

    it("should track statusSince when status changes", () => {
      const now = Date.now();

      state.setPeer("PJSIP/1001", { status: "Reachable" });
      const firstSince = state.getPeer("PJSIP/1001").statusSince;

      // Same status - should keep original statusSince
      state.setPeer("PJSIP/1001", { status: "Reachable" });
      expect(state.getPeer("PJSIP/1001").statusSince).toBe(firstSince);

      // Different status - should update statusSince
      state.setPeer("PJSIP/1001", { status: "Unreachable" });
      const newSince = state.getPeer("PJSIP/1001").statusSince;
      expect(newSince).toBeGreaterThanOrEqual(firstSince);
    });

    it("should get all peers as array", () => {
      state.setPeer("PJSIP/1001", { status: "Reachable" });
      state.setPeer("PJSIP/1002", { status: "Unreachable" });

      const peers = state.getAllPeers();

      expect(Array.isArray(peers)).toBe(true);
      expect(peers.length).toBe(2);
    });
  });

  describe("AMI connection state", () => {
    it("should track AMI connection status", () => {
      expect(state.isAmiConnected()).toBe(false);

      state.setAmiConnected(true);
      expect(state.isAmiConnected()).toBe(true);

      state.setAmiConnected(false);
      expect(state.isAmiConnected()).toBe(false);
    });
  });

  describe("stats", () => {
    it("should return correct stats", () => {
      state.setCall("12345.001", { id: 1 });
      state.setCall("12345.002", { id: 2 });
      state.setPeer("PJSIP/1001", { status: "Reachable" });
      state.setPeer("PJSIP/1002", { status: "Reachable" });
      state.setPeer("PJSIP/1003", { status: "Unreachable" });

      const stats = state.getStats();

      expect(stats.active_calls).toBe(2);
      expect(stats.peers).toBe(3);
    });

    it("should return zero stats when empty", () => {
      const stats = state.getStats();

      expect(stats.active_calls).toBe(0);
      expect(stats.peers).toBe(0);
    });
  });
});
