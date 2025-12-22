import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import SummaryCard from './SummaryCard';

// Helper to generate mock history data since we don't have a backend history endpoint yet
const generateMockHistory = (edgeName) => {
  const history = [];
  const now = new Date();
  
  // Generate 24 hours of data (1 point per hour)
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    // Random status: 2=Connected, 1=Partial, 0=Offline
    // Weighted heavily towards connected (2)
    const rand = Math.random();
    let statusVal = 2; 
    if (rand > 0.95) statusVal = 0; // Occasional outage
    else if (rand > 0.85) statusVal = 1; // Occasional packet loss

    history.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      statusVal: statusVal,
      statusLabel: statusVal === 2 ? 'Connected' : statusVal === 1 ? 'Partial' : 'Offline',
      packetLoss: statusVal === 2 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 20) + 10,
      latency: Math.floor(Math.random() * 50) + 20
    });
  }
  return history;
};

const EdgeHistoryPage = ({ edge, onBack }) => {
  const [historyData, setHistoryData] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    if (edge) {
      setHistoryData(generateMockHistory(edge.edge_name));
    }
  }, [edge, timeRange]);

  if (!edge) return null;

  // KPIs
  const downtime = historyData.filter(d => d.statusVal === 0).length; // Hours offline in mock
  const availability = ((1 - (downtime / 24)) * 100).toFixed(1);
  const totalFlaps = Math.floor(Math.random() * 12) + 1; // Mock flap count

  return (
    <div id="edge-history-page" className="page">
      {/* Header with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button className="btn btn-icon" onClick={onBack} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
          ← Back
        </button>
        <div>
          <h2 style={{ margin: 0 }}>{edge.edge_name || `Edge ${edge.edge_id}`}</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {edge.edge_state} • {edge.links?.length || 0} Links
          </span>
        </div>
        <div className={`pill ${edge.classification || 'offline'}`} style={{ marginLeft: 'auto' }}>
          {(edge.classification || 'UNKNOWN').toUpperCase()}
        </div>
      </div>

      {/* KPI Cards */}
      <section className="summary-grid">
        <SummaryCard title="Availability (24h)" value={`${availability}%`} />
        <SummaryCard title="Total Flaps" value={totalFlaps} />
        <SummaryCard title="Avg Latency" value={`${Math.round(historyData.reduce((a,b)=>a+b.latency,0)/historyData.length)} ms`} />
        <SummaryCard title="Current Status" value={edge.classification?.toUpperCase()} />
      </section>

      <div className="analytics-charts-grid">
        {/* Timeline Chart */}
        <div className="summary-card" style={{ gridColumn: '1 / -1', minHeight: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3>Status Timeline & Latency</h3>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStatus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#198754" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#198754" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderRadius: '8px' }} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              
              <Area 
                type="step" 
                dataKey="statusVal" 
                name="Status (0=Off, 2=On)" 
                stroke="#198754" 
                fillOpacity={1} 
                fill="url(#colorStatus)" 
              />
              <Area 
                type="monotone" 
                dataKey="latency" 
                name="Latency (ms)" 
                stroke="#0d6efd" 
                fill="transparent" 
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ISP Flap Chart */}
        <div className="summary-card">
          <h3>Link Stability (Flaps by ISP)</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Number of state changes per provider.</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={edge.links || []} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="isp" width={100} style={{ fontSize: '12px' }} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="link_id" name="Flaps (Simulated)" fill="#ffc107" barSize={20} radius={[0, 4, 4, 0]}>
                 {/* Simulating flap count based on link ID just for viz */}
                {(edge.links || []).map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ffc107' : '#dc3545'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Events Table */}
        <div className="summary-card">
          <h3>Recent Events Log</h3>
          <div className="interfaces-table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            <table className="interfaces-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>10 mins ago</td>
                  <td>Interface GE2 (Comcast) Latency High</td>
                  <td><span className="pill partial">WARNING</span></td>
                </tr>
                <tr>
                  <td>2 hours ago</td>
                  <td>Edge recovered from Offline</td>
                  <td><span className="pill connected">INFO</span></td>
                </tr>
                <tr>
                  <td>2 hours ago</td>
                  <td>Edge went OFFLINE</td>
                  <td><span className="pill offline">CRITICAL</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EdgeHistoryPage;