import React from 'react';

const statusColor = {
  offline: 'var(--danger)',
  partial: 'var(--warning)',
  connected: 'var(--success)'
};

const AlertsPage = ({ incidents }) => {
  return (
    <div id="alerts-page" className="page">
      <div className="summary-card">
        <h3>Alerts & Incidents</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Historical record of outages, degradations, and recoveries.
        </p>

        <div className="interfaces-table-wrapper">
          <table className="interfaces-table">
            <thead>
              <tr>
                <th>Edge</th>
                <th>Change</th>
                <th>Time</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan="4">No incidents recorded.</td>
                </tr>
              ) : (
                incidents.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.edge_name}</td>
                    <td>
                      <span style={{ color: statusColor[i.old] }}>
                        {i.old.toUpperCase()}
                      </span>
                      {' → '}
                      <span style={{ color: statusColor[i.new] }}>
                        {i.new.toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(i.time).toLocaleString()}</td>
                    <td>{i.duration || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
