// Call data from AMI
export interface Call {
  type: 'start' | 'update' | 'end';
  uniqueid: string;
  linkedid: string;
  channel: string;
  callerid: string;
  calleridname?: string;
  state: string;
  exten?: string;
  context?: string;
  application?: string;
  connectedlinenum?: string;
  connectedlinename?: string;
  accountcode?: string;
  startTime?: number;
  destination?: string;
  destchannel?: string;
  dialstatus?: string;
  duration?: string;
}

// Peer/Extension data
export interface Peer {
  peer: string;
  status: string;
  address: string;
  statusSince?: number;
}

// AMI connection status
export interface AmiStatus {
  connected: boolean;
  error?: string;
}

// Initial state from server
export interface InitialState {
  calls: Call[];
  peers: Peer[];
}

// Call update event payload
export interface CallUpdate {
  type: 'start' | 'update' | 'end';
  uniqueid: string;
  channel?: string;
  callerid?: string;
  calleridname?: string;
  state?: string;
  exten?: string;
  context?: string;
  application?: string;
  connectedlinenum?: string;
  connectedlinename?: string;
  linkedid?: string;
  accountcode?: string;
  startTime?: number;
  destination?: string;
  destchannel?: string;
  dialstatus?: string;
  cause?: string;
}

// Debug event from AMI
export interface DebugEvent {
  event: string;
  channel?: string;
  calleridnum?: string;
  dialstring?: string;
  destchannel?: string;
  exten?: string;
  application?: string;
  [key: string]: unknown;
}

// Debug log entry
export interface DebugEntry {
  id: number;
  time: string;
  message: string;
  type: 'system' | 'error' | 'call' | 'peer' | 'event' | 'info';
}

// Merged call for display (combining channel legs)
export interface MergedCall {
  linkedid: string;
  channel: string;
  callerid: string;
  state: string;
  startTime?: number;
  destination: string;
  destchannel?: string;
  isOutgoing: boolean;
}
