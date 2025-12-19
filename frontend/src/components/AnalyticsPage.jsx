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

const AnalyticsPage = ({ meta, analytics, edges, onEdgeClick }) => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedIsp, setSelectedIsp] = useState(null); // NEW
  const [drillDownType, setDrillDownType] = useState('health'); // 'health', 'status', or 'isp'

  if (!meta || !analytics) return <div className="placeholder-page">Loading Analytics...</div>;

  // --- DATA ---
  const healthData = [
    { name: 'Connected', value: meta.connected, color: '#198754', key: 'connected' },
    { name: 'Partial', value: meta.partial, color: '#ffc107', key: 'partial' },
    { name: 'Offline', value: meta.offline, color: '#dc3545', key: 'offline' },
  ];

  const connectedCount = edges?.filter(e => (e.edge_state || '').toUpperCase() === 'CONNECTED').length || 0;
  const offlineCount = edges?.filter(e => (e.edge_state || '').toUpperCase() === 'OFFLINE').length || 0;
  const connectionStatusData = [
    { name: 'Connected', value: connectedCount, color: '#198754', key: 'connected_strict' },
    { name: 'Offline', value: offlineCount, color: '#dc3545', key: 'offline_strict' },
  ];

  const ispData = (analytics.ispStats || []).map(item => ({
    ...item,
    total: item.total || (item.stable + item.unstable)
  }));

  // --- PIE LABEL ---
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

  // --- HANDLERS ---
  const handlePieClick = (data, type) => {
    if (data?.key) {
      setSelectedStatus(data.key);
      setSelectedIsp(null);
      setDrillDownType(type);
    }
  };

  const handleIspBarClick = (data) => {
    if (data?.name) {
      setSelectedIsp(data.name);
      setSelectedStatus(null);
      setDrillDownType('isp');
    }
  };

  // --- FILTER EDGES ---
  const getFilteredEdges = () => {
    if (!edges) return [];

    if (drillDownType === 'isp' && selectedIsp) {
      return edges.filter(edge =>
        edge.links?.some(link => link.isp === selectedIsp)
      );
    }

    if (drillDownType === 'health' && selectedStatus) {
      if (selectedStatus === 'connected') return edges.filter(e => e.classification === 'connected');
      if (selectedStatus === 'partial') return edges.filter(e => e.classification === 'partial');
      if (selectedStatus === 'offline') return edges.filter(e => e.classification === 'offline');
    }

    if (drillDownType === 'status' && selectedStatus) {
      if (selectedStatus === 'connected_strict') return edges.filter(e => (e.edge_state || '').toUpperCase() === 'CONNECTED');
      if (selectedStatus === 'offline_strict') return edges.filter(e => (e.edge_state || '').toUpperCase() === 'OFFLINE');
    }

    return [];
  };

  const getModalTitle = () => {
    if (drillDownType === 'isp') {
      return `Edges using ISP: ${selectedIsp}`;
    }
    const map = {
      'connected': 'Healthy / Connected Edges',
      'partial': 'Partial / Degraded Edges',
      'offline': 'Offline Edges',
      'connected_strict': 'All Connected Edges',
      'offline_strict': 'All Offline Edges'
    };
    return map[selectedStatus] || 'Edges';
  };

  const closeModal = () => {
    setSelectedStatus(null);
    setSelectedIsp(null);
  };

  return (
    <div id="analytics-page" className="page">
      <section className="summary-grid">
        <SummaryCard title="Total Edges" value={meta.total ?? 0} />
        <SummaryCard title="Total Links Tracked" value={ispData.reduce((sum, isp) => sum + (isp.total || 0), 0)} />
        <SummaryCard title="Last Updated" value={new Date(meta.fetchedAt).toLocaleTimeString()} />
      </section>

      <div className="analytics-charts-grid">
        {/* Chart 1 */}
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
                cursor="pointer"
              >
                {healthData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} stroke="#fff" />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, `${name} Edges`]} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2 */}
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
                cursor="pointer"
              >
                {connectionStatusData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} stroke="#fff" />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, `${name} Edges`]} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* ✅ Chart 3: ISP — Now CLICKABLE */}
        <div className="summary-card" style={{ minHeight: '400px', gridColumn: '1 / -1' }}>
          <h3>Link Count by ISP</h3>
          <ResponsiveContainer width="100%" height={Math.max(300, ispData.length * 50)}>
            <BarChart
              data={ispData.slice(0, 15)}
              layout="vertical"
              margin={{ top: 5, right: 100, left: 10, bottom: 5 }}
              onClick={(state) => {
                if (state.activePayload?.[0]?.payload) {
                  handleIspBarClick(state.activePayload[0].payload);
                }
              }}
            >
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Legend verticalAlign="top" height={36} />

              <Bar dataKey="stable" name="Stable" stackId="a" fill="#198754" barSize={30}>
                <LabelList dataKey="stable" position="insideLeft" fill="#fff" fontWeight="bold" fontSize={12} />
              </Bar>

              <Bar dataKey="unstable" name="Unstable" stackId="a" fill="#dc3545" barSize={30}>
                <LabelList dataKey="unstable" position="insideRight" fill="#fff" fontWeight="bold" fontSize={12} />
              </Bar>

              <Bar dataKey="total" fill="transparent" barSize={0}>
                <LabelList
                  dataKey="total"
                  position="right"
                  fill="#0d6efd"
                  fontWeight="bold"
                  fontSize={13}
                  formatter={(value) => `Total: ${value}`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal */}
      {(selectedStatus || selectedIsp) && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-inner" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <button className="close-btn" onClick={closeModal}>✕</button>
            <EdgeList
              title={getModalTitle()}
              status={drillDownType === 'isp' ? 'all' : selectedStatus?.includes('offline') ? 'offline' : selectedStatus?.includes('partial') ? 'partial' : 'connected'}
              edges={getFilteredEdges()}
              onEdgeClick={onEdgeClick} // ✅ Pass through to open DetailsModal
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