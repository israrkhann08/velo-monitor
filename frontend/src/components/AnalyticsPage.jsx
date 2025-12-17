import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  LabelList 
} from 'recharts';
import SummaryCard from './SummaryCard';
import EdgeList from './EdgeList';

const AnalyticsPage = ({ meta, analytics, edges }) => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [drillDownType, setDrillDownType] = useState('health'); // 'health' or 'status'

  if (!meta || !analytics) return <div className="placeholder-page">Loading Analytics...</div>;

  // --- DATA PREPARATION ---

  // 1. Original Health Data
  const healthData = [
    { name: 'Connected', value: meta.connected, color: '#198754', key: 'connected' },
    { name: 'Partial', value: meta.partial, color: '#ffc107', key: 'partial' },
    { name: 'Offline', value: meta.offline, color: '#dc3545', key: 'offline' },
  ];

  // 2. Strict Connection Data (Matches App.jsx logic)
  const connectedCount = edges ? edges.filter(e => (e.edge_state || '').toUpperCase() === 'CONNECTED').length : 0;
  const offlineCount = edges ? edges.filter(e => (e.edge_state || '').toUpperCase() === 'OFFLINE').length : 0;

  const connectionStatusData = [
    { name: 'Connected', value: connectedCount, color: '#198754', key: 'connected_strict' },
    { name: 'Offline', value: offlineCount, color: '#dc3545', key: 'offline_strict' },
  ];

  // 3. ISP Data - Ensure 'total' exists for calculations
  const ispData = (analytics.ispStats || []).map(item => ({
    ...item,
    total: item.total || (item.stable + item.unstable) // Fallback calculation
  }));

  // --- CUSTOM LABELS (With Crash Protection) ---

  const RADIAN = Math.PI / 180;
  
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }) => {
    if (percent < 0.05) return null; 
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textColor = (name === 'Partial') ? '#000' : '#fff';

    return (
      <text x={x} y={y} fill={textColor} textAnchor="middle" dominantBaseline="central" fontWeight="bold" fontSize={13}>
        {`${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  // Label for Stable (Green) Bar
  const renderStableLabel = (props) => {
    const { x, y, width, height, value, payload } = props;
    
    // SAFETY CHECK: Prevent crash if payload is undefined
    if (!payload) return null; 
    
    // Check if Unstable is 0 (meaning this Green bar is the only bar)
    const unstableValue = payload.unstable || 0;
    const totalValue = payload.total || (value + unstableValue);
    const isUnstableZero = unstableValue === 0;

    return (
      <g>
        {/* Show Value Inside Green Bar if width allows */}
        {value > 0 && (
          <text x={x + width / 2} y={y + height / 1.5} fill="#fff" textAnchor="middle" fontSize={12} fontWeight="bold">
            {value}
          </text>
        )}
        
        {/* Show TOTAL to the right ONLY if there is no Red bar to hold it */}
        {isUnstableZero && (
          <text x={x + width + 5} y={y + height / 1.5} fill="#000" textAnchor="start" fontSize={12} fontWeight="bold">
            {totalValue}
          </text>
        )}
      </g>
    );
  };

  // Label for Unstable (Red) Bar
  const renderUnstableLabel = (props) => {
    const { x, y, width, height, value, payload } = props;
    
    // SAFETY CHECK
    if (!payload) return null;

    const totalValue = payload.total || ((payload.stable || 0) + value);

    return (
      <g>
        {/* Show Value Inside Red Bar (if > 0) */}
        {value > 0 && (
          <text x={x + width / 2} y={y + height / 1.5} fill="#fff" textAnchor="middle" fontSize={12} fontWeight="bold">
            {value}
          </text>
        )}
        
        {/* ALWAYS Show Total to the right of the Red Bar */}
        <text x={x + width + 5} y={y + height / 1.5} fill="#000" textAnchor="start" fontSize={12} fontWeight="bold">
          {totalValue}
        </text>
      </g>
    );
  };

  // --- ACTIONS ---

  const handlePieClick = (data, type) => {
    if (data && data.key) {
      setDrillDownType(type);
      setSelectedStatus(data.key);
    }
  };

  const getFilteredEdges = () => {
    if (!edges || !selectedStatus) return [];

    if (drillDownType === 'health') {
      if (selectedStatus === 'connected') return edges.filter(e => e.classification === 'connected');
      if (selectedStatus === 'partial') return edges.filter(e => e.classification === 'partial');
      if (selectedStatus === 'offline') return edges.filter(e => e.classification === 'offline');
    }

    if (drillDownType === 'status') {
      // Case-insensitive match for strictly CONNECTED or OFFLINE
      if (selectedStatus === 'connected_strict') return edges.filter(e => (e.edge_state || '').toUpperCase() === 'CONNECTED');
      if (selectedStatus === 'offline_strict') return edges.filter(e => (e.edge_state || '').toUpperCase() === 'OFFLINE');
    }
    return [];
  };

  const modalTitleMap = {
    'connected': 'Healthy / Connected Edges',
    'partial': 'Partial / Degraded Edges',
    'offline': 'Offline Edges',
    'connected_strict': 'All Connected Edges',
    'offline_strict': 'All Offline Edges'
  };

  return (
    <div id="analytics-page" className="page">
      {/* Top Cards */}
      <section className="summary-grid">
        <SummaryCard title="Total Edges" value={meta.total} />
        <SummaryCard title="Total Links Tracked" value={ispData.reduce((acc, curr) => acc + curr.total, 0)} />
        <SummaryCard title="Last Updated" value={new Date(meta.fetchedAt).toLocaleTimeString()} />
      </section>

      <div className="analytics-charts-grid">
        
        {/* Chart 1: Edge Health (Existing) */}
        <div className="summary-card" style={{ minHeight: '400px' }}>
          <h3>Edge Health Distribution</h3>
          <p style={{ fontSize: '12px', color: '#6c757d', marginBottom: '10px' }}>
            Includes Partial/Degraded status.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={healthData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderPieLabel}
                outerRadius={100}
                innerRadius={50}
                dataKey="value"
                onClick={(data) => handlePieClick(data, 'health')}
                style={{ cursor: 'pointer' }}
              >
                {healthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, `${name} Edges`]} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: NEW Strict Overview */}
        <div className="summary-card" style={{ minHeight: '400px' }}>
          <h3>Edge Status Overview</h3>
          <p style={{ fontSize: '12px', color: '#6c757d', marginBottom: '10px' }}>
            Strict Connected vs Offline.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={connectionStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderPieLabel}
                outerRadius={100}
                innerRadius={50}
                dataKey="value"
                onClick={(data) => handlePieClick(data, 'status')}
                style={{ cursor: 'pointer' }}
              >
                {connectionStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, `${name} Edges`]} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Link Count by ISP (With Totals Aside) */}
        <div className="summary-card" style={{ minHeight: '400px', gridColumn: '1 / -1' }}>
          <h3>Link Count by ISP</h3>
          <ResponsiveContainer width="100%" height={ispData.length * 50 > 300 ? ispData.length * 50 : 300}>
            <BarChart 
              data={ispData.slice(0, 15)} 
              layout="vertical" 
              margin={{ top: 5, right: 50, left: 10, bottom: 5 }} 
            >
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={140} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Legend verticalAlign="top" height={36} />

              <Bar dataKey="stable" name="Stable" stackId="a" fill="#198754" barSize={30}>
                 <LabelList content={renderStableLabel} />
              </Bar>

              <Bar dataKey="unstable" name="Unstable" stackId="a" fill="#dc3545" barSize={30}>
                 <LabelList content={renderUnstableLabel} />
              </Bar>

            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drill-down Modal */}
      {selectedStatus && (
        <div className="modal" onClick={() => setSelectedStatus(null)}>
          <div className="modal-inner" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <button className="close-btn" onClick={() => setSelectedStatus(null)}>✕</button>
            <EdgeList 
              title={modalTitleMap[selectedStatus] || 'Edges'}
              status={selectedStatus.includes('offline') ? 'offline' : selectedStatus.includes('partial') ? 'partial' : 'connected'}
              edges={getFilteredEdges()}
              onEdgeClick={() => {}} 
            />
            {getFilteredEdges().length === 0 && (
              <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No edges found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;