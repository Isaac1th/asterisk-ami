import { useSocket } from './hooks/useSocket';
import { Header } from './components/Header';
import { CallsTable } from './components/CallsTable';
import { PeersList } from './components/PeersList';
import { DebugPanel } from './components/DebugPanel';

export default function App() {
  const { isConnected, amiStatus, calls, peers, debugLog, refresh, clearDebugLog } =
    useSocket();

  return (
    <div className="container">
      <Header isConnected={isConnected} amiStatus={amiStatus} onRefresh={refresh} />

      <div className="grid">
        <CallsTable calls={calls} peers={peers} />
      </div>

      <PeersList peers={peers} />

      <DebugPanel debugLog={debugLog} onClear={clearDebugLog} />
    </div>
  );
}
