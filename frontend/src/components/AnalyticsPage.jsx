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
import EdgeList from './EdgeList'; // We reuse the EdgeList component for the popup

const AnalyticsPage = ({ meta, analytics, edges }) => {
  // State to handle the drill-down modal
  const [selectedStatus, setSelectedStatus] = useState(null);

  if (!meta || !analytics) return <div className="placeholder-page">Loading Analytics...</div>;

  const statusData = [
    { name: 'Connected', value: meta.connected, color: '#198754', key: 'connected' },
    { name: 'Partial', value: meta.partial, color: '#ffc107', key: 'partial' },
    { name: 'Offline', value: meta.offline, color: '#dc3545', key: 'offline' },
  ];

  // Prepare ISP data
  const ispData = analytics.ispStats || [];

  // --- Custom Label Logic ---
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }) => {
    // Only show label if the slice is big enough (greater than 5%)
    if (percent < 0.05) return null;

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Text color: Black for yellow background, White for others
    const textColor = name === 'Partial' ? '#000' : '#fff';

    return (
      <text 
        x={x} 
        y={y} 
        fill={textColor} 
        textAnchor="middle" 
        dominantBaseline="central" 
        fontWeight="bold"
        fontSize={13}
      >
        {/* Shows: 12 (45%) */}
        {`${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  // --- Click Handler ---
  const handlePieClick = (data) => {
    if (data && data.key) {
      setSelectedStatus(data.key);
    }
  };

  // --- Filter Edges for Modal ---
  const getFilteredEdges = () => {
    if (!edges || !selectedStatus) return [];
    return edges.filter(e => e.classification === selectedStatus);
  };

  // Custom formatter for Bar Chart
  const renderCustomLabel = (props) => {
    const { x, y, width, height, value } = props;
    if (!value || value === 0) return null; 
    return (
      <text x={x + width / 2} y={y + height / 1.5} fill="#fff" textAnchor="middle" fontSize={12} fontWeight="bold">
        {value}
      </text>
    );
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
        
        {/* Chart 1: Edge Health Distribution */}
        <div className="summary-card" style={{ minHeight: '400px' }}>
          <h3>Edge Health Distribution</h3>
          <p style={{ fontSize: '12px', color: '#6c757d', marginBottom: '10px' }}>
            Click on a slice to view details.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false} // Hide the line connecting label to slice
                label={renderCustomizedLabel} // Use our custom internal label
                outerRadius={120}
                innerRadius={50} // Makes it a Donut
                fill="#8884d8"
                dataKey="value"
                onClick={handlePieClick} // Make it interactive
                style={{ cursor: 'pointer' }}
              >
                {statusData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    stroke="rgba(255,255,255,0.5)" // Add a slight border for separation
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, `${name} Edges`]} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Links per ISP */}
        <div className="summary-card" style={{ minHeight: '400px' }}>
          <h3>Link Count by ISP</h3>
          <ResponsiveContainer width="100%" height={ispData.length * 50 > 300 ? ispData.length * 50 : 300}>
            <BarChart 
              data={ispData.slice(0, 10)} 
              layout="vertical" 
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={140} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="stable" name="Stable" stackId="a" fill="#198754" barSize={30}>
                 <LabelList content={renderCustomLabel} />
              </Bar>
              <Bar dataKey="unstable" name="Unstable" stackId="a" fill="#dc3545" barSize={30}>
                 <LabelList content={renderCustomLabel} />
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
            
            {/* Reuse EdgeList logic but styled for the modal */}
            <EdgeList 
              title={`${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Edges`}
              status={selectedStatus}
              edges={getFilteredEdges()}
              onEdgeClick={() => {}} // Optional: If you want to drill down further into specific edge details
            />

            {getFilteredEdges().length === 0 && (
              <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No edges found in this category.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;