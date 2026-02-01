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
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [debugLog]);

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
          <div key={entry.id} className="debug-entry">
            <span className="debug-time">[{entry.time}]</span>{' '}
            <span style={{ color: typeColors[entry.type] }}>{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
