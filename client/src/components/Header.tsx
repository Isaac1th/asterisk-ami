import { StatusIndicator } from './StatusIndicator';
import type { AmiStatus } from '../types';

interface HeaderProps {
  isConnected: boolean;
  amiStatus: AmiStatus;
  onRefresh: () => void;
}

export function Header({ isConnected, amiStatus, onRefresh }: HeaderProps) {
  return (
    <header>
      <h1>Asterisk Live Monitor</h1>
      <div className="status-bar">
        <StatusIndicator
          connected={amiStatus.connected}
          label={amiStatus.connected ? 'AMI: Connected' : 'AMI: Disconnected'}
        />
        <StatusIndicator
          connected={isConnected}
          label={isConnected ? 'Socket: Connected' : 'Socket: Connecting...'}
        />
        <button className="btn btn-primary" onClick={onRefresh}>
          Refresh
        </button>
      </div>
    </header>
  );
}
