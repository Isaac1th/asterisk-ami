import { useState, useRef, useEffect } from 'react';
import type { DebugEntry } from '../types';

interface DebugPanelProps {
  debugLog: DebugEntry[];
  onClear: () => void;
}

const typeColors: Record<DebugEntry['type'], string> = {
  system: '#888',
  error: '#f55',
  call: '#5f5',
  peer: '#55f',
  event: '#0ff',
  info: '#fff',
};

export function DebugPanel({ debugLog, onClear }: DebugPanelProps) {
  const [visible, setVisible] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DebugEntry | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [debugLog]);

  const handleEntryClick = (entry: DebugEntry) => {
    if (entry.rawData) {
      setSelectedEvent(entry);
    }
  };

  return (
    <div className="debug-panel">
      <h3>
        Debug Log
        <div>
          <button className="btn btn-secondary" onClick={onClear}>
            Clear
          </button>
          <button className="btn btn-secondary" onClick={() => setVisible(!visible)}>
            {visible ? 'Hide' : 'Show'}
          </button>
        </div>
      </h3>
      <div
        ref={logRef}
        id="debug-log"
        style={{ display: visible ? 'block' : 'none' }}
      >
        {debugLog.map((entry) => (
          <div
            key={entry.id}
            className="debug-entry"
            onClick={() => handleEntryClick(entry)}
            style={{
              cursor: entry.rawData ? 'pointer' : 'default',
              padding: '2px 4px',
              borderRadius: '2px',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (entry.rawData) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span className="debug-time">[{entry.time}]</span>{' '}
            <span style={{ color: typeColors[entry.type] }}>
              {entry.message}
              {entry.rawData && <span style={{ marginLeft: '8px', opacity: 0.5 }}>▶</span>}
            </span>
          </div>
        ))}
      </div>

      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              minWidth: '400px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, color: '#0ff' }}>
                AMI Event: {selectedEvent.rawData?.event as string || 'Unknown'}
              </h4>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {Object.entries(selectedEvent.rawData || {}).map(([key, value]) => (
                  <tr key={key} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '8px', color: '#888', fontWeight: 'bold', verticalAlign: 'top' }}>
                      {key}
                    </td>
                    <td style={{ padding: '8px', color: '#fff', wordBreak: 'break-all' }}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
