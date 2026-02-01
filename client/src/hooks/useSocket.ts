import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  Call,
  Peer,
  AmiStatus,
  InitialState,
  CallUpdate,
  DebugEvent,
  DebugEntry,
} from '../types';

interface UseSocketReturn {
  isConnected: boolean;
  amiStatus: AmiStatus;
  calls: Record<string, Call>;
  peers: Record<string, Peer>;
  debugLog: DebugEntry[];
  refresh: () => void;
  clearDebugLog: () => void;
}

let debugIdCounter = 0;

export function useSocket(): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [amiStatus, setAmiStatus] = useState<AmiStatus>({ connected: false });
  const [calls, setCalls] = useState<Record<string, Call>>({});
  const [peers, setPeers] = useState<Record<string, Peer>>({});
  const [debugLog, setDebugLog] = useState<DebugEntry[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const addLog = useCallback(
    (message: string, type: DebugEntry['type'] = 'info') => {
      const time = new Date().toLocaleTimeString();
      setDebugLog((prev) => [
        ...prev.slice(-99), // Keep last 100 entries
        { id: ++debugIdCounter, time, message, type },
      ]);
    },
    []
  );

  const clearDebugLog = useCallback(() => {
    setDebugLog([]);
    addLog('Debug log cleared', 'system');
  }, [addLog]);

  const refresh = useCallback(() => {
    if (socketRef.current) {
      addLog('Requesting refresh...', 'system');
      socketRef.current.emit('refresh');
    }
  }, [addLog]);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      addLog('Socket.IO connected', 'system');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      addLog('Socket.IO disconnected', 'error');
    });

    socket.on('connect_error', (err: Error) => {
      addLog('Socket.IO error: ' + err.message, 'error');
    });

    socket.on('ami_status', (data: AmiStatus) => {
      setAmiStatus(data);
      if (data.connected) {
        addLog('AMI connected', 'system');
      } else {
        addLog('AMI disconnected' + (data.error ? ': ' + data.error : ''), 'error');
      }
    });

    socket.on('initial_state', (data: InitialState) => {
      addLog(
        `Received initial state: ${data.calls.length} calls, ${data.peers.length} peers`,
        'system'
      );

      // Load calls
      const callsMap: Record<string, Call> = {};
      data.calls.forEach((call) => {
        callsMap[call.uniqueid] = call;
      });
      setCalls(callsMap);

      // Load peers
      const peersMap: Record<string, Peer> = {};
      data.peers.forEach((peer) => {
        peersMap[peer.peer] = peer;
      });
      setPeers(peersMap);
    });

    socket.on('call_update', (data: CallUpdate) => {
      setCalls((prev) => {
        const updated = { ...prev };

        if (data.type === 'start') {
          updated[data.uniqueid] = data as Call;
          addLog('Call start: ' + (data.callerid || data.channel), 'call');
        } else if (data.type === 'update' && updated[data.uniqueid]) {
          const call = { ...updated[data.uniqueid] };
          if (data.state) call.state = data.state;
          if (data.application) call.application = data.application;
          if (data.context) call.context = data.context;
          if (data.exten) call.exten = data.exten;
          if (data.destination) call.destination = data.destination;
          if (data.destchannel) call.destchannel = data.destchannel;
          if (data.dialstatus) call.dialstatus = data.dialstatus;
          if (data.connectedlinenum)
            call.connectedlinenum = call.connectedlinenum || data.connectedlinenum;
          if (data.connectedlinename)
            call.connectedlinename = call.connectedlinename || data.connectedlinename;
          updated[data.uniqueid] = call;
        } else if (data.type === 'end') {
          delete updated[data.uniqueid];
          addLog('Call end: ' + data.channel, 'call');
        }

        return updated;
      });
    });

    socket.on('peer_update', (data: Peer) => {
      addLog('Peer update: ' + data.peer + ' - ' + data.status, 'peer');
      setPeers((prev) => ({
        ...prev,
        [data.peer]: data,
      }));
    });

    socket.on('debug_event', (evt: DebugEvent) => {
      const callEvents = [
        'newchannel',
        'dialbegin',
        'dialend',
        'newstate',
        'hangup',
        'newexten',
      ];
      if (callEvents.includes(evt.event?.toLowerCase())) {
        const details: string[] = [];
        if (evt.channel) details.push('ch:' + evt.channel);
        if (evt.calleridnum) details.push('from:' + evt.calleridnum);
        if (evt.dialstring) details.push('to:' + evt.dialstring);
        if (evt.destchannel) details.push('dest:' + evt.destchannel);
        if (evt.exten) details.push('exten:' + evt.exten);
        if (evt.application) details.push('app:' + evt.application);
        addLog(
          'AMI: ' + evt.event + (details.length ? ' [' + details.join(', ') + ']' : ''),
          'event'
        );
      } else {
        addLog('AMI: ' + evt.event, 'event');
      }
    });

    addLog('Dashboard loaded, connecting...', 'system');

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [addLog]);

  return {
    isConnected,
    amiStatus,
    calls,
    peers,
    debugLog,
    refresh,
    clearDebugLog,
  };
}
