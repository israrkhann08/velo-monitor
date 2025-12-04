import React, { useRef, useEffect } from 'react';
import { BellIcon, MenuIcon } from './Icons';

const pageConfig = {
  'dashboard': { title: 'Edge Sites Dashboard', subtitle: 'Connectivity overview' },
  'analytics': { title: 'System Analytics', subtitle: 'Performance metrics and reports' },
  'isp-monitor': { title: 'ISP Performance', subtitle: 'Provider stability & link distribution' }
};

const Header = ({ 
  currentPage, 
  searchQuery, 
  setSearchQuery, 
  onRefresh, 
  notifications, 
  isNotifListVisible, 
  setNotifListVisible,
  onToggleMenu 
}) => {
  const notifRef = useRef(null);
  
  useEffect(() => {
    // Search debounce placeholder
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifListVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setNotifListVisible]);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand-group">
          {/* Mobile Menu Toggle */}
          <button className="menu-toggle-btn" onClick={onToggleMenu} aria-label="Toggle Navigation">
            <MenuIcon />
          </button>
          
          <div className="brand">
            <h1>{pageConfig[currentPage]?.title || 'VeloCloud'}</h1>
            <p className="subtitle">{pageConfig[currentPage]?.subtitle || ''}</p>
          </div>
        </div>

        <div className="controls">
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onInput={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn refresh-btn" onClick={onRefresh}>Refresh</button>
          
          <div className="notifications" ref={notifRef}>
            <button className="btn btn-icon" onClick={() => setNotifListVisible(v => !v)}>
              <BellIcon />
              {notifications.length > 0 && <span className="notif-count">{notifications.length}</span>}
            </button>
            {isNotifListVisible && (
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-item">No new notifications.</div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="notif-item">{`[${n.time}] ${n.message}`}</div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;