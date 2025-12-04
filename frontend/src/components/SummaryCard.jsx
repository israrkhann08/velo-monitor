import React from 'react';

const SummaryCard = ({ title, value }) => {
  return (
    <div className="summary-card">
      <h3>{title}</h3>
      <div className="big">{value}</div>
    </div>
  );
};

export default SummaryCard;