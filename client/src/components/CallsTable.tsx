import { useMemo, useState, useEffect } from 'react';
import type { Call, MergedCall, Peer } from '../types';

interface CallsTableProps {
  calls: Record<string, Call>;
  peers: Record<string, Peer>;
}

interface ExtensionRow {
  extension: string;
  status: 'available' | 'offline' | 'in_call' | 'ringing' | 'dialing';
  statusText: string;
  startTime?: number;
  inCallWith?: string;
}

function formatDuration(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function DurationCell({ startTime }: { startTime?: number }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return <td className="duration-cell">00:00:00</td>;
  return <td className="duration-cell">{formatDuration(Date.now() - startTime)}</td>;
}

export function CallsTable({ calls, peers }: CallsTableProps) {
  // Group channels by linkedid to get merged call data
  const mergedCalls = useMemo<MergedCall[]>(() => {
    const callsByLinkedId: Record<string, Call[]> = {};
    Object.values(calls).forEach((call) => {
      const lid = call.linkedid || call.uniqueid;
      if (!callsByLinkedId[lid]) {
        callsByLinkedId[lid] = [];
      }
      callsByLinkedId[lid].push(call);
    });

    return Object.entries(callsByLinkedId).map(([linkedid, channels]) => {
      const primary = channels.find((c) => c.uniqueid === c.linkedid) || channels[0];
      const secondary = channels.find((c) => c !== primary);

      return {
        linkedid,
        channel: primary.channel,
        callerid: primary.callerid || secondary?.callerid || 'Unknown',
        state: primary.state || secondary?.state || 'Active',
        startTime: primary.startTime || secondary?.startTime,
        destination:
          primary.destination ||
          secondary?.callerid ||
          primary.exten ||
          primary.connectedlinenum ||
          '-',
        destchannel: primary.destchannel || secondary?.channel,
        isOutgoing: !!(
          primary.channel &&
          (primary.channel.includes('OUT') || primary.destination)
        ),
      };
    });
  }, [calls]);

  // Build extension rows from peers, enriched with call data
  const extensionRows = useMemo<ExtensionRow[]>(() => {
    // Create a map of extension -> call info
    const extensionCallMap: Record<string, MergedCall> = {};
    mergedCalls.forEach((call) => {
      // Extract extension from caller ID or channel
      let ext = call.callerid;
      if (ext === 'Unknown' && call.channel) {
        const match = call.channel.match(/\/([^-]+)/);
        if (match) ext = match[1];
      }
      if (ext && ext !== 'Unknown') {
        extensionCallMap[ext] = call;
      }
    });

    // Build rows from all peers
    return Object.values(peers)
      .map((peer) => {
        // Extract extension number from peer name (e.g., "PJSIP/100" -> "100")
        const extMatch = peer.peer.match(/\/(.+)$/);
        const extension = extMatch ? extMatch[1] : peer.peer;

        const call = extensionCallMap[extension];
        const statusLower = peer.status.toLowerCase();
        // Check for unreachable states first (unavailable contains 'avail' so must check first)
        const isUnreachable = statusLower.includes('unavailable') ||
                              statusLower.includes('unreachable') ||
                              statusLower.includes('unknown') ||
                              statusLower.includes('unregistered');
        const isReachable = !isUnreachable && (
                           statusLower.includes('reachable') ||
                           statusLower.includes('ok') ||
                           statusLower.includes('avail') ||
                           statusLower.includes('registered'));

        if (call) {
          // Extension is on a call
          const state = (call.state || 'Active').toLowerCase();
          let status: ExtensionRow['status'] = 'in_call';
          let statusText = 'In Call';

          if (state.includes('ring')) {
            status = 'ringing';
            statusText = 'Ringing';
          } else if (state.includes('dial') || state.includes('down')) {
            status = 'dialing';
            statusText = 'Dialing';
          }

          return {
            extension,
            status,
            statusText,
            startTime: call.startTime,
            inCallWith: call.destination,
          };
        } else {
          // Extension is not on a call - use statusSince from peer
          return {
            extension,
            status: (isReachable ? 'available' : 'offline') as ExtensionRow['status'],
            statusText: isReachable ? 'Available' : 'Offline',
            startTime: peer.statusSince,
          };
        }
      })
      .sort((a, b) => {
        // Sort: in_call/ringing/dialing first, then available, then offline
        const statusOrder: Record<ExtensionRow['status'], number> = {
          ringing: 0, dialing: 1, in_call: 2, available: 3, offline: 4
        };
        const orderDiff = statusOrder[a.status] - statusOrder[b.status];
        if (orderDiff !== 0) return orderDiff;
        return a.extension.localeCompare(b.extension, undefined, { numeric: true });
      });
  }, [peers, mergedCalls]);

  // Count active calls for the header
  const activeCallCount = extensionRows.filter(
    (r) => r.status === 'in_call' || r.status === 'ringing' || r.status === 'dialing'
  ).length;

  return (
    <div className="card" style={{ gridColumn: 'span 2' }}>
      <h2>
        Active Calls
        <span className="count">{activeCallCount}</span>
      </h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="calls-table">
          <thead>
            <tr>
              <th>Extension</th>
              <th>Status</th>
              <th>Duration</th>
              <th>In Call With</th>
            </tr>
          </thead>
          <tbody>
            {extensionRows.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={4}>No extensions found</td>
              </tr>
            ) : (
              extensionRows.map((row) => {
                // Determine status icon and class
                let statusIcon = '✓';
                let iconClass = 'available';

                if (row.status === 'ringing') {
                  statusIcon = '🔔';
                  iconClass = 'ringing';
                } else if (row.status === 'in_call') {
                  statusIcon = '📞';
                  iconClass = 'connected';
                } else if (row.status === 'dialing') {
                  statusIcon = '📱';
                  iconClass = 'outgoing';
                } else if (row.status === 'offline') {
                  statusIcon = '✗';
                  iconClass = 'offline';
                }

                return (
                  <tr key={row.extension}>
                    <td>
                      <strong>{row.extension}</strong>
                    </td>
                    <td>
                      <div className="status-cell">
                        <span className={`status-icon ${iconClass}`}>{statusIcon}</span>
                        <span>{row.statusText}</span>
                      </div>
                    </td>
                    <DurationCell startTime={row.startTime} />
                    <td className="destination-cell">{row.inCallWith || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
