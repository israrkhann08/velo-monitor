import React, { useEffect, useRef } from 'react';

const niceDate = (iso) => {
  try {
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleString();
  } catch (e) {
    return iso;
  }
};

// ADD: onViewHistory prop
const DetailsModal = ({ edge, onClose, onViewHistory }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!edge) return null;

  return (
    <div className="modal">
      <div className="modal-inner" ref={modalRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ margin: 0 }}>{`${edge.edge_name || `Edge ${edge.edge_id}`} — ${edge.edge_state || "—"}`}</h3>
            <button className="close-btn" onClick={onClose} style={{ position: 'static' }}>✕</button>
        </div>

        <div id="modal-body" style={{ marginTop: '20px' }}>
          
          {/* NEW: Action Bar */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button 
                className="btn" 
                onClick={() => onViewHistory(edge)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                View Full History & Analytics →
            </button>
          </div>

          <div className="interfaces-table-wrapper">
            <table className="interfaces-table">
              <thead>
                <tr>
                  <th>Interface</th>
                  <th>ISP / Display</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th>Last Event</th>
                </tr>
              </thead>
              <tbody>
                {edge.links && edge.links.length > 0 ? (
                  edge.links.map((link, index) => (
                    <tr key={link.key || index}>
                      <td>{link.interface}</td>
                      <td>{link.isp}</td>
                      <td>{link.state}</td>
                      <td>{niceDate(link.lastActive)}</td>
                      <td>{link.lastEvent}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No links/interfaces found for this edge.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;