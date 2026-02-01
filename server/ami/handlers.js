// AMI event handlers

function registerHandlers(ami, io, state) {
  // SIP peer entries (response to SIPpeers)
  ami.on("peerentry", (evt) => {
    console.log("[Peer Entry]", evt.objectname, evt.status);
    const peerData = {
      peer: evt.objectname || evt.channeltype + "/" + evt.objectname,
      status: evt.status || "Unknown",
      address: evt.ipaddress || evt.ipport || "N/A",
    };
    state.setPeer(peerData.peer, peerData);
    io.emit("peer_update", peerData);
  });

  // PJSIP endpoint entries (from PJSIPShowEndpoints if used)
  ami.on("endpointlist", (evt) => {
    console.log("[PJSIP Endpoint]", evt.objectname, evt.devicestate);
    // Only include numeric endpoints (extensions, not trunks)
    if (evt.objectname && /^\d+$/.test(evt.objectname)) {
      const peerData = {
        peer: "PJSIP/" + evt.objectname,
        status: evt.devicestate || "Unknown",
        address: evt.transport || "N/A",
      };
      state.setPeer(peerData.peer, peerData);
      io.emit("peer_update", peerData);
    }
  });

  // Peer status changes (real-time)
  ami.on("peerstatus", (evt) => {
    console.log("[Peer Status Change]", evt.peer, evt.peerstatus);
    const peerData = {
      peer: evt.peer,
      status: evt.peerstatus,
      address: evt.address || "N/A",
    };
    state.setPeer(peerData.peer, peerData);
    io.emit("peer_update", peerData);
  });

  // Device state changes
  ami.on("devicestatechange", (evt) => {
    console.log("[Device State]", evt.device, evt.state);
    io.emit("device_state", {
      device: evt.device,
      state: evt.state,
    });
  });

  // New channels (call start)
  ami.on("newchannel", (evt) => {
    console.log(
      "[New Channel]",
      evt.channel,
      evt.calleridnum,
      "exten:",
      evt.exten,
      "context:",
      evt.context,
    );
    console.log("[New Channel Full Event]", JSON.stringify(evt, null, 2));
    const callData = {
      type: "start",
      channel: evt.channel,
      callerid: evt.calleridnum || evt.calleridname || "Unknown",
      calleridname: evt.calleridname || "",
      state: evt.channelstatedesc || evt.channelstate,
      uniqueid: evt.uniqueid,
      exten: evt.exten || evt.dnid || "",
      context: evt.context || "",
      application: evt.application || "",
      connectedlinenum: evt.connectedlinenum || "",
      connectedlinename: evt.connectedlinename || "",
      linkedid: evt.linkedid || "",
      accountcode: evt.accountcode || "",
      startTime: Date.now(),
    };
    state.setCall(evt.uniqueid, callData);
    console.log(
      "[Emitting call_update]",
      callData.uniqueid,
      "startTime:",
      callData.startTime,
      "exten:",
      callData.exten,
    );
    io.emit("call_update", callData);
  });

  // Channel state changes
  ami.on("newstate", (evt) => {
    console.log("[Channel State]", evt.channel, evt.channelstatedesc);
    const call = state.getCall(evt.uniqueid);
    if (call) {
      call.state = evt.channelstatedesc;
      if (evt.connectedlinenum) call.connectedlinenum = evt.connectedlinenum;
      if (evt.connectedlinename) call.connectedlinename = evt.connectedlinename;

      io.emit("call_update", {
        type: "update",
        uniqueid: evt.uniqueid,
        state: evt.channelstatedesc,
        channel: evt.channel,
        connectedlinenum: evt.connectedlinenum || call.connectedlinenum,
        connectedlinename: evt.connectedlinename || call.connectedlinename,
      });
    }
  });

  // Dialplan execution (application changes)
  ami.on("newexten", (evt) => {
    const call = state.getCall(evt.uniqueid);
    if (call) {
      call.application = evt.application || call.application;
      call.context = evt.context || call.context;
      call.exten = evt.exten || call.exten;

      io.emit("call_update", {
        type: "update",
        uniqueid: evt.uniqueid,
        application: evt.application,
        context: evt.context,
        exten: evt.exten,
        channel: evt.channel,
      });
    }
  });

  // DialBegin - captures the destination being dialed
  ami.on("dialbegin", (evt) => {
    console.log(
      "[DialBegin]",
      evt.channel,
      "->",
      evt.destchannel,
      "dialstring:",
      evt.dialstring,
    );
    console.log("[DialBegin Full]", JSON.stringify(evt, null, 2));

    const call = state.getCall(evt.uniqueid);
    if (call) {
      call.destination = evt.dialstring || "";
      call.destchannel = evt.destchannel || "";
      // Try to extract number from destchannel (e.g., PJSIP/2001-00000001 -> 2001)
      if (!call.destination && evt.destchannel) {
        const match = evt.destchannel.match(/\/([^-]+)/);
        if (match) call.destination = match[1];
      }

      console.log("[DialBegin] Setting destination to:", call.destination);

      io.emit("call_update", {
        type: "update",
        uniqueid: evt.uniqueid,
        destination: call.destination,
        destchannel: call.destchannel,
        channel: evt.channel,
      });
    } else {
      console.log(
        "[DialBegin] WARNING: No active call found for uniqueid:",
        evt.uniqueid,
      );
    }
  });

  // DialEnd - call answered or failed
  ami.on("dialend", (evt) => {
    console.log("[DialEnd]", evt.channel, "dialstatus:", evt.dialstatus);
    const call = state.getCall(evt.uniqueid);
    if (call) {
      call.dialstatus = evt.dialstatus;
      io.emit("call_update", {
        type: "update",
        uniqueid: evt.uniqueid,
        dialstatus: evt.dialstatus,
        channel: evt.channel,
      });
    }
  });

  // Hangup (call end)
  ami.on("hangup", (evt) => {
    console.log("[Hangup]", evt.channel, evt.cause, evt.causetxt);
    state.deleteCall(evt.uniqueid);
    io.emit("call_update", {
      type: "end",
      channel: evt.channel,
      uniqueid: evt.uniqueid,
      cause: evt.causetxt || evt.cause,
    });
  });

  // Active channel entries (response to CoreShowChannels)
  ami.on("coreshowchannel", (evt) => {
    console.log("[Active Channel]", evt.channel, evt.calleridnum);
    // Parse duration string (format: "00:00:05") to seconds
    let durationSecs = 0;
    if (evt.duration) {
      const parts = evt.duration.split(":");
      if (parts.length === 3) {
        durationSecs =
          parseInt(parts[0]) * 3600 +
          parseInt(parts[1]) * 60 +
          parseInt(parts[2]);
      }
    }
    const callData = {
      type: "start",
      channel: evt.channel,
      callerid: evt.calleridnum || "Unknown",
      calleridname: evt.calleridname || "",
      state: evt.channelstatedesc || "Active",
      uniqueid: evt.uniqueid,
      exten: evt.exten || evt.extension || "",
      context: evt.context || "",
      application: evt.application || "",
      connectedlinenum: evt.connectedlinenum || "",
      connectedlinename: evt.connectedlinename || "",
      linkedid: evt.linkedid || "",
      accountcode: evt.accountcode || "",
      duration: evt.duration,
      startTime: Date.now() - durationSecs * 1000,
    };
    state.setCall(evt.uniqueid, callData);
    io.emit("call_update", callData);
  });
}

module.exports = { registerHandlers };
