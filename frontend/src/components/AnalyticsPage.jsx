import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import SummaryCard from './SummaryCard';

const COLORS = ['#198754', '#ffc107', '#dc3545', '#0d6efd', '#6610f2'];

const AnalyticsPage = ({ meta, analytics }) => {
  if (!meta || !analytics) return <div className="placeholder-page">Loading Analytics...</div>;

  const statusData = [
    { name: 'Connected', value: meta.connected },
    { name: 'Partial', value: meta.partial },
    { name: 'Offline', value: meta.offline },
  ];

  // Prepare ISP data for Bar Chart
  const ispData = analytics.ispStats || [];

  return (
    <div id="analytics-page" className="page">
      {/* Top Cards Reuse */}
      <section className="summary-grid">
        <SummaryCard title="Total Edges" value={meta.total} />
        <SummaryCard title="Total Links Tracked" value={ispData.reduce((acc, curr) => acc + curr.total, 0)} />
        <SummaryCard title="Last Updated" value={new Date(meta.fetchedAt).toLocaleTimeString()} />
      </section>

      {/* Changed from inline style to class for responsive stacking */}
      <div className="analytics-charts-grid">
        
        {/* Chart 1: Edge Health Status */}
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

        {/* Chart 2: Links per ISP */}
        <div className="summary-card" style={{ minHeight: '400px' }}>
          <h3>Link Count by ISP</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ispData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}} />
              <Tooltip />
              <Bar dataKey="total" fill="#0d6efd" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;