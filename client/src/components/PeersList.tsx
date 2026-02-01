import { useMemo, useState } from 'react';
import type { Peer } from '../types';

interface PeersListProps {
  peers: Record<string, Peer>;
}

function isReachablePeer(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return (
    s.includes('not in use') ||
    s.includes('ok') ||
    s.includes('registered') ||
    s.includes('reachable') ||
    s.includes('in use') ||
    s.includes('ringing') ||
    s.includes('busy')
  );
}

function getPeerStatusInfo(status: string | undefined): {
  statusClass: string;
  displayStatus: string;
} {
  if (!status) return { statusClass: 'bg-gray', displayStatus: 'Unknown' };
  const s = status.toLowerCase();

  // Reachable/Available states
  if (
    s.includes('not in use') ||
    s.includes('ok') ||
    s.includes('registered') ||
    s.includes('reachable')
  ) {
    return { statusClass: 'bg-green', displayStatus: 'Reachable' };
  }
  // Currently in use
  if (s.includes('in use') || s.includes('busy') || s.includes('ringing')) {
    return { statusClass: 'bg-blue', displayStatus: 'In Use' };
  }
  // Unreachable
  if (s.includes('unreachable')) {
    return { statusClass: 'bg-red', displayStatus: 'Unreachable' };
  }
  // Unavailable/unknown states
  if (s.includes('unavailable') || s.includes('unknown')) {
    return { statusClass: 'bg-red', displayStatus: 'Unavailable' };
  }
  // Unregistered
  if (s.includes('unregistered') || s.includes('lagged')) {
    return { statusClass: 'bg-yellow', displayStatus: 'Unregistered' };
  }
  return { statusClass: 'bg-gray', displayStatus: status };
}

export function PeersList({ peers }: PeersListProps) {
  const [isVisible, setIsVisible] = useState(true);

  const sortedPeers = useMemo(() => {
    const peerList = Object.values(peers);

    // Sort peers: reachable/registered first, then by name
    return peerList.sort((a, b) => {
      const aReachable = isReachablePeer(a.status);
      const bReachable = isReachablePeer(b.status);
      if (aReachable && !bReachable) return -1;
      if (!aReachable && bReachable) return 1;
      return (a.peer || '').localeCompare(b.peer || '');
    });
  }, [peers]);

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>
          Extensions / Peers
          <span className="count">{sortedPeers.length}</span>
        </span>
        <button className="btn btn-secondary" onClick={() => setIsVisible(!isVisible)}>
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </h2>
      {isVisible && (
        <ul>
          {sortedPeers.length === 0 ? (
            <li className="empty-state">Waiting for peer data...</li>
          ) : (
            sortedPeers.map((peer) => {
              const { statusClass, displayStatus } = getPeerStatusInfo(peer.status);
              return (
                <li key={peer.peer} className="peer-item">
                  <div>
                    <strong>{peer.peer}</strong>
                    <br />
                    <small style={{ color: '#888' }}>{peer.address || ''}</small>
                  </div>
                  <span className={`badge ${statusClass}`}>{displayStatus}</span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
