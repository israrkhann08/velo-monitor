import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const IspMonitorPage = ({ analytics }) => {
  const ispStats = analytics?.ispStats || [];

  return (
    <div id="isp-monitor-page" className="page">
      <div className="summary-card" style={{ marginBottom: '24px' }}>
        <h3>ISP Reliability (Stable vs Unstable Links)</h3>
        <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
          This graph shows the total number of links per provider, split by their current stability status (Up/Stable vs Down/Unstable).
        </p>
        
        <div style={{ width: '100%', height: 500 }}>
          <ResponsiveContainer>
            <BarChart
              data={ispStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
              <XAxis dataKey="name" stroke="#6c757d" fontSize={12} tickLine={false} />
              <YAxis stroke="#6c757d" fontSize={12} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                cursor={{ fill: '#f8f9fa' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="stable" name="Stable/Connected" stackId="a" fill="#198754" barSize={50} />
              <Bar dataKey="unstable" name="Unstable/Down" stackId="a" fill="#dc3545" barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table View with scroll wrapper */}
      <div className="summary-card">
        <h3>Provider Details</h3>
        <div className="interfaces-table-wrapper">
          <table className="interfaces-table">
            <thead>
              <tr>
                <th>Provider Name</th>
                <th>Total Links</th>
                <th>Stable Links</th>
                <th>Unstable Links</th>
                <th>Reliability %</th>
              </tr>
            </thead>
            <tbody>
              {ispStats.map((isp, idx) => {
                const reliability = isp.total > 0 ? ((isp.stable / isp.total) * 100).toFixed(1) : 0;
                return (
                  <tr key={idx}>
                    <td>{isp.name}</td>
                    <td>{isp.total}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{isp.stable}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{isp.unstable}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '100px', background: '#e9ecef', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${reliability}%`, background: reliability > 80 ? 'var(--success)' : reliability > 50 ? 'var(--warning)' : 'var(--danger)', height: '100%' }}></div>
                        </div>
                        {reliability}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IspMonitorPage;