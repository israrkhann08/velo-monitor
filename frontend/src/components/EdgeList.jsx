import React from 'react';
import EdgeItem from './EdgeItem';

const EdgeList = ({ title, status, edges, onEdgeClick }) => {
  return (
    <div className="list-col">
      <h2><span className={`status-dot ${status}`}></span>{title}</h2>
      <div className="list">
        {edges.map(edge => (
          <EdgeItem key={edge.edge_id} edge={edge} onEdgeClick={onEdgeClick} />
        ))}
      </div>
    </div>
  );
};

export default EdgeList;