import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import SummaryCard from './SummaryCard';

const SystemHealthPage = ({ health }) => {
  const { 
    sseStatus, 
    backendStatus, 
    latency, 
    isPolling, 
    lastCheck 
  } = health;

  // Visual helpers
  const getStatusColor = (status) => {
    if (status === 'CONNECTED' || status === 'ONLINE') return 'var(--success)';
    if (status === 'CONNECTING') return 'var(--warning)';
    return 'var(--danger)';
  };

  // Mock data for a latency chart (in a real app, you'd keep a history array in App.jsx)
  const latencyData = [
    { time: '10s', ms: latency - 5 },
    { time: '5s', ms: latency + 2 },
    { time: 'Now', ms: latency }
  ];

  return (
    <div id="system-health-page" className="page">
      <div className="summary-card" style={{ marginBottom: '24px' }}>
        <h3>System Internals</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Real-time diagnostics of the frontend-backend connection.
        </p>
      </div>

      <section className="summary-grid">
        {/* Backend Status */}
        <div className="summary-card" style={{ borderLeft: `5px solid ${getStatusColor(backendStatus)}` }}>
          <h3>Backend API</h3>
          <div className="big" style={{ color: getStatusColor(backendStatus) }}>
            {backendStatus}
          </div>
          <p style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
            {backendStatus === 'ONLINE' ? 'Rest API reachable' : 'API Unreachable'}
          </p>
        </div>

        {/* SSE Status */}
        <div className="summary-card" style={{ borderLeft: `5px solid ${getStatusColor(sseStatus)}` }}>
          <h3>Real-time Feed (SSE)</h3>
          <div className="big" style={{ color: getStatusColor(sseStatus) }}>
            {sseStatus}
          </div>
          <p style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
            {sseStatus === 'CONNECTED' ? 'Live push updates active' : 'Stream disconnected'}
          </p>
        </div>

        {/* Latency */}
        <div className="summary-card">
          <h3>Last Latency</h3>
          <div className="big"> {latency !== null && latency !== undefined ? `${latency}ms` : '—'} </div>
          <p style={{ fontSize: '12px', marginTop: '8px', color: latency > 500 ? 'var(--danger)' : 'var(--success)' }}>
            {latency < 200 ? 'Optimal' : latency < 1000 ? 'Slow' : 'Critical Lag'}
          </p>
        </div>

        {/* Mode */}
        <div className="summary-card">
          <h3>Sync Mode</h3>
          <div className="big" style={{ color: 'var(--accent-primary)' }}>
            {isPolling ? 'POLLING (Fallback)' : 'PUSH (Live)'}
          </div>
          <p style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
            {isPolling ? 'Refreshing every 30s' : 'Event-driven'}
          </p>
        </div>
      </section>

      <div className="analytics-charts-grid">
        <div className="summary-card">
          <h3>Connection Logic</h3>
          <ul style={{ lineHeight: '1.8', color: 'var(--text-primary)', paddingLeft: '20px' }}>
            <li>
              <strong>Last Health Check:</strong> {lastCheck ? new Date(lastCheck).toLocaleTimeString() : 'Never'}
            </li>
            <li>
              <strong>Protocol:</strong> {isPolling ? 'HTTP GET (Interval)' : 'Server-Sent Events (EventSource)'}
            </li>
            <li>
              <strong>Endpoint:</strong> {isPolling ? '/api/edges' : '/events'}
            </li>
            <li>
              <strong>Retry Strategy:</strong> {isPolling ? 'Automatic (30s)' : 'Auto-reconnect on drop'}
            </li>
          </ul>
        </div>

        <div className="summary-card">
          <h3>Response Time (Est.)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={latencyData}>
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="ms" fill="var(--accent-primary)" barSize={40} radius={[5,5,0,0]}>
                 {latencyData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.ms > 300 ? 'var(--danger)' : 'var(--accent-primary)'} />
                 ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPage;