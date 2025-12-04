import React from 'react';

const EdgeItem = ({ edge, onEdgeClick }) => {
  const handleClick = () => {
    onEdgeClick(edge);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      onEdgeClick(edge);
    }
  };

  return (
    <div className="edge-item" tabIndex="0" onClick={handleClick} onKeyDown={handleKeyDown}>
      <div>
        <div className="edge-name">{edge.edge_name || `Edge ${edge.edge_id}`}</div>
        <div className="edge-meta">{`${edge.link_count || 0} link(s) • ${edge.edge_state || "—"}`}</div>
      </div>
      <div className={`pill ${edge.classification || "offline"}`}>
        {(edge.classification || "UNKNOWN").toUpperCase()}
      </div>
    </div>
  );
};

export default EdgeItem;