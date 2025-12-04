import React from 'react';
import { DashboardIcon, AnalyticsIcon, VeloCloudIcon, GraphIcon, CloseIcon } from './Icons';

const Sidebar = ({ currentPage, setCurrentPage, isOpen, onClose }) => {
  const handleNavClick = (e, page) => {
    e.preventDefault();
    setCurrentPage(page);
  };

  return (
    <nav id="sidebar" className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <VeloCloudIcon />
          <span className="nav-text">VeloCloud</span>
        </div>
        
        {/* Mobile Close Button */}
        <button className="close-sidebar-btn" onClick={onClose} aria-label="Close menu">
          <CloseIcon />
        </button>
      </div>

      <ul className="nav-list">
        <li>
          <a href="#" className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'dashboard')}>
            <DashboardIcon />
            <span className="nav-text">Dashboard</span>
          </a>
        </li>
        <li>
          <a href="#" className={`nav-link ${currentPage === 'analytics' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'analytics')}>
            <AnalyticsIcon />
            <span className="nav-text">Analytics</span>
          </a>
        </li>
        <li>
          <a href="#" className={`nav-link ${currentPage === 'isp-monitor' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'isp-monitor')}>
            <GraphIcon />
            <span className="nav-text">ISP Monitor</span>
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;