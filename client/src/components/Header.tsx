import type { AmiStatus } from '../types';

interface HeaderProps {
  isConnected: boolean;
  amiStatus: AmiStatus;
  onRefresh: () => void;
}

type ConnectionState = 'connected' | 'partial' | 'disconnected';

function getConnectionState(socketConnected: boolean, amiConnected: boolean): {
  state: ConnectionState;
  label: string;
  subtitle: string;
} {
  if (socketConnected && amiConnected) {
    return {
      state: 'connected',
      label: 'Connected',
      subtitle: 'AMI & Socket active',
    };
  }
  if (socketConnected && !amiConnected) {
    return {
      state: 'partial',
      label: 'AMI Disconnected',
      subtitle: 'Socket OK, waiting for AMI...',
    };
  }
  return {
    state: 'disconnected',
    label: 'Disconnected',
    subtitle: 'Connecting to server...',
  };
}

export function Header({ isConnected, amiStatus, onRefresh }: HeaderProps) {
  const { state, label, subtitle } = getConnectionState(isConnected, amiStatus.connected);

  return (
    <header>
      <h1>Asterisk Live Monitor</h1>
      <div className="status-bar">
        <div className={`connection-status ${state}`}>
          <div className="connection-main">
            <span className="connection-dot"></span>
            <span className="connection-label">{label}</span>
          </div>
          <span className="connection-subtitle">{subtitle}</span>
        </div>
        <button className="btn btn-primary" onClick={onRefresh}>
          Refresh
        </button>
      </div>
    </header>
  );
}
