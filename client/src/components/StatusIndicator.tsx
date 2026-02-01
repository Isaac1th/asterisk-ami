interface StatusIndicatorProps {
  connected: boolean;
  label: string;
}

export function StatusIndicator({ connected, label }: StatusIndicatorProps) {
  return (
    <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
      <span className="status-dot"></span>
      <span>{label}</span>
    </div>
  );
}
