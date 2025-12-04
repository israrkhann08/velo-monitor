import React from 'react';
import SummaryCard from './SummaryCard';
import EdgeList from './EdgeList';

const DashboardPage = ({ meta, connected, partial, offline, onEdgeClick }) => {
  return (
    <div id="dashboard-page" className="page">
      <section className="summary-grid">
        <SummaryCard title="Total Edges" value={meta?.total ?? 0} />
        <SummaryCard title="Connected" value={meta?.connected ?? 0} />
        <SummaryCard title="Partial / Degraded" value={meta?.partial ?? 0} />
        <SummaryCard title="Offline" value={meta?.offline ?? 0} />
      </section>
      <section className="lists">
        <EdgeList title="Connected" status="connected" edges={connected} onEdgeClick={onEdgeClick} />
        <EdgeList title="Partial / Degraded" status="partial" edges={partial} onEdgeClick={onEdgeClick} />
        <EdgeList title="Offline" status="offline" edges={offline} onEdgeClick={onEdgeClick} />
      </section>
    </div>
  );
};

export default DashboardPage;