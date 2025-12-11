import React from 'react';
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

const AnalyticsPage = ({ meta, analytics }) => {
  if (!meta || !analytics) return <div className="placeholder-page">Loading Analytics...</div>;

  const statusData = [
    { name: 'Connected', value: meta.connected },
    { name: 'Partial', value: meta.partial },
    { name: 'Offline', value: meta.offline },
  ];

  // Prepare ISP data
  const ispData = analytics.ispStats || [];

  // Custom label for Pie Chart percentages
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    if (percent === 0) return null;
    return `${(percent * 100).toFixed(0)}%`;
  };

  // Custom formatter for the Bar Chart labels (hide 0 values)
  const renderCustomLabel = (props) => {
    const { x, y, width, height, value } = props;
    if (!value || value === 0) return null; // Don't show 0
    return (
      <text 
        x={x + width / 2} 
        y={y + height / 1.5} 
        fill="#fff" 
        textAnchor="middle" 
        fontSize={12}
        fontWeight="bold"
      >
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
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={renderPieLabel} 
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={[ '#198754', '#ffc107', '#dc3545' ][index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Links per ISP (Stacked: Stable vs Unstable) */}
        <div className="summary-card" style={{ minHeight: '400px' }}>
          <h3>Link Count by ISP</h3>
          <ResponsiveContainer width="100%" height={ispData.length * 50 > 300 ? ispData.length * 50 : 300}>
            <BarChart 
              data={ispData.slice(0, 10)} 
              layout="vertical" 
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={140} 
                tick={{fontSize: 12}} 
              />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Legend verticalAlign="top" height={36} />

              {/* Stacked Bar 1: Stable */}
              <Bar dataKey="stable" name="Stable" stackId="a" fill="#198754" barSize={30}>
                 <LabelList content={renderCustomLabel} />
              </Bar>

              {/* Stacked Bar 2: Unstable (Shows distinct Red section if any links are down) */}
              <Bar dataKey="unstable" name="Unstable" stackId="a" fill="#dc3545" barSize={30}>
                 <LabelList content={renderCustomLabel} />
              </Bar>

            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;