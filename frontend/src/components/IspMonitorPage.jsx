import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  CartesianGrid,
  LabelList // <--- Imported LabelList
} from 'recharts';

const IspMonitorPage = ({ analytics }) => {
  const ispStats = analytics?.ispStats || [];

  // Calculate a dynamic width. If many ISPs, make chart wider so it scrolls instead of squishing.
  // Base width 100%, but if we have > 10 items, add 80px per item.
  const minChartWidth = ispStats.length * 80;

  return (
    <div id="isp-monitor-page" className="page">
      <div className="summary-card" style={{ marginBottom: '24px' }}>
        <h3>ISP Reliability (Stable vs Unstable Links)</h3>
        <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
          This graph shows the total number of links per provider, split by their current stability status.
        </p>
        
        {/* Scroll wrapper to handle many ISP names */}
        <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ width: `max(100%, ${minChartWidth}px)`, height: 500 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ispStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }} // Increased bottom margin for rotated labels
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                
                {/* interval={0} forces all labels to show. angle={-45} prevents overlap */}
                <XAxis 
                  dataKey="name" 
                  stroke="#6c757d" 
                  fontSize={12} 
                  tickLine={false} 
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                />
                
                <YAxis stroke="#6c757d" fontSize={12} tickLine={false} />
                
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f8f9fa' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                <Bar dataKey="stable" name="Stable/Connected" stackId="a" fill="#198754" barSize={50}>
                  {/* Show Stable count inside the green bar in white */}
                  <LabelList dataKey="stable" position="center" fill="#ffffff" style={{ fontWeight: 'bold' }} />
                </Bar>
                
                <Bar dataKey="unstable" name="Unstable/Down" stackId="a" fill="#dc3545" barSize={50}>
                  {/* Show Unstable count on top of the stack */}
                  <LabelList dataKey="unstable" position="top" fill="#dc3545" style={{ fontWeight: 'bold' }} />
                </Bar>

              </BarChart>
            </ResponsiveContainer>
          </div>
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