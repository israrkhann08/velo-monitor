// src/App.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './components/DashboardPage';
import AnalyticsPage from './components/AnalyticsPage';
import IspMonitorPage from './components/IspMonitorPage';
import AlertsPage from './components/AlertsPage';
import EdgeHistoryPage from './components/EdgeHistoryPage';
import SystemHealthPage from './components/SystemHealthPage'; // ✅ New Import
import DetailsModal from './components/DetailsModal';
import Toast from './components/Toast';

const sortByName = (a, b) => {
  const A = (a.edge_name || "").toLowerCase();
  const B = (b.edge_name || "").toLowerCase();
  return A < B ? -1 : A > B ? 1 : 0;
};

function App() {
  // ---------------- Navigation State ----------------
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [historyEdge, setHistoryEdge] = useState(null); // For Edge History Page

  // ---------------- Data State ----------------
  const [data, setData] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [selectedEdge, setSelectedEdge] = useState(null); // For Details Modal

  // ---------------- UI State ----------------
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isNotifListVisible, setNotifListVisible] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ---------------- System Health State (✅ NEW) ----------------
  const [health, setHealth] = useState({
    sseStatus: 'CONNECTING', // CONNECTED, DISCONNECTED, CONNECTING
    backendStatus: 'UNKNOWN', // ONLINE, OFFLINE
    latency: 0,
    isPolling: false,
    lastCheck: null
  });

  // ---------------- Refs ----------------
  const sounds = useRef({});
  const sseRef = useRef(null);
  const fallbackIntervalRef = useRef(null);
  const isAudioUnlocked = useRef(false);
  const dataRef = useRef();
  dataRef.current = data; // Keep track of old data for diffing

  // ---------------- Navigation Handlers ----------------
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    setHistoryEdge(null); // Reset drill-down when changing main tabs
  };

  const handleViewHistory = (edge) => {
    setSelectedEdge(null); // Close modal
    setHistoryEdge(edge);  // Set target edge
    setCurrentPage('edge-history'); // Switch view
  };

  const handleBackToDash = () => {
    setHistoryEdge(null);
    setCurrentPage('dashboard');
  };

  // ---------------- Audio System ----------------
  const unlockAudio = () => {
    if (isAudioUnlocked.current) return;
    Object.values(sounds.current).forEach(sound => {
      sound.play().then(() => sound.pause()).catch(() => {});
    });
    isAudioUnlocked.current = true;
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };

  const playSound = (type) => {
    if (!isAudioUnlocked.current || !sounds.current[type]) return;
    sounds.current[type].currentTime = 0;
    sounds.current[type].play().catch(() => {});
  };

  useEffect(() => {
    sounds.current = {
      offline: new Audio('/sounds/offline.mp3'),
      partial: new Audio('/sounds/partial.mp3'),
      connected: new Audio('/sounds/connected.mp3'),
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // ---------------- Notifications ----------------
  const addToast = (message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const addNotification = (message, type = "info") => {
    const notif = { message, type, time: new Date().toLocaleTimeString() };
    setNotifications(prev => [notif, ...prev.slice(0, 49)]);
  };

  // ---------------- Logic: State Changes ----------------
  // ---------------- State Change Processing ----------------
  const processStateChanges = useCallback((newData, oldData) => {
    if (!oldData?.edges) return;

    const oldMap = new Map(oldData.edges.map(e => [e.edge_id, e]));
    const now = Date.now();

    newData.edges.forEach(newEdge => {
      const oldEdge = oldMap.get(newEdge.edge_id);
      if (!oldEdge || oldEdge.classification === newEdge.classification) return;

      const oldStatus = oldEdge.classification;
      const newStatus = newEdge.classification;

      let message = '';
      let type = '';
      let sound = '';

      if (newStatus === 'offline') {
        message = `🔴 Edge "${newEdge.edge_name}" went OFFLINE.`;
        type = 'error';
        sound = 'offline';
      } else if (newStatus === 'partial' && oldStatus === 'connected') {
        message = `🟡 Edge "${newEdge.edge_name}" is DEGRADED.`;
        type = 'warning';
        sound = 'partial';
      } else if (newStatus === 'connected' && oldStatus !== 'connected') {
        message = `🟢 Edge "${newEdge.edge_name}" recovered.`;
        type = 'success';
        sound = 'connected';
      }

      if (message) {
        addNotification(message, type);
        addToast(message, type);
        playSound(sound);

        // 🚀 TRIGGER REMOTE ALERTS (If you added the backend)
        if (type === 'error' || type === 'warning') {
          // sendRemoteAlert(message, type); 
        }

        setIncidents(prev => {
          const updated = [...prev];
          let durationStr = null;

          // ✅ Fix: Calculate duration when recovering
          if (newStatus === 'connected' && oldStatus === 'offline') {
            // Find the most recent 'offline' event for this edge
            const lastOffline = updated.find(
              i => i.edge_id === newEdge.edge_id && i.new === 'offline'
            );

            if (lastOffline) {
              const diffMs = now - new Date(lastOffline.time).getTime();
              const diffMins = Math.round(diffMs / 60000);
              
              // Format: "10 min" or "< 1 min"
              durationStr = diffMins < 1 ? '< 1 min' : `${diffMins} min`;
              
              // Optional: Update the old row too, so history looks complete
              lastOffline.duration = durationStr;
            }
          }

          // Add new incident to the TOP of the list
          updated.unshift({
            edge_id: newEdge.edge_id,
            edge_name: newEdge.edge_name,
            old: oldStatus,
            new: newStatus,
            time: new Date().toISOString(),
            duration: durationStr // ✅ Now the top row will show the duration
          });

          return updated.slice(0, 200);
        });
      }
    });
  }, []);

  // ---------------- Data Fetching (HTTP) ----------------
  const fetchData = useCallback(async () => {
    const startTime = performance.now(); // ⏱ Measure Latency
    try {
      const res = await fetch('/api/edges');
      if (!res.ok) throw new Error(res.status);
      const newData = await res.json();
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      processStateChanges(newData, dataRef.current);
      setData(newData);

      // ✅ Update Health: Success
      setHealth(prev => ({
        ...prev,
        backendStatus: 'ONLINE',
        latency: latency,
        lastCheck: Date.now()
      }));

    } catch (err) {
      // ❌ Update Health: Failure
      setHealth(prev => ({
        ...prev,
        backendStatus: 'OFFLINE',
        latency: 0,
        lastCheck: Date.now()
      }));
      addToast('Failed to load data.', 'error');
    }
  }, [processStateChanges]);

  // ---------------- Polling Fallback ----------------
  const startFallbackPolling = useCallback(() => {
    // Set status to Polling
    setHealth(prev => ({ ...prev, isPolling: true, sseStatus: 'DISCONNECTED' }));

    if (fallbackIntervalRef.current) return;
    fetchData();
    fallbackIntervalRef.current = setInterval(fetchData, 30000);
  }, [fetchData]);

  // ---------------- SSE Connection ----------------
  const startSSE = useCallback(() => {
    if (!window.EventSource) {
      startFallbackPolling();
      return;
    }

    sseRef.current = new EventSource('/events');

    // ✅ Connection Opened
    sseRef.current.onopen = () => {
      setHealth(prev => ({ 
        ...prev, 
        sseStatus: 'CONNECTED', 
        isPolling: false, 
        backendStatus: 'ONLINE' 
      }));
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };

    // ✅ Message Received
    sseRef.current.onmessage = (ev) => {
      try {
        const newData = JSON.parse(ev.data);
        if (newData.type === 'ping') {
           return; // Heartbeat
        }
        processStateChanges(newData, dataRef.current);
        setData(newData);
        setHealth(prev => ({ ...prev, lastCheck: Date.now() }));
      } catch {}
    };

    // ❌ Connection Error
    sseRef.current.onerror = () => {
      sseRef.current?.close();
      sseRef.current = null;
      setHealth(prev => ({ ...prev, sseStatus: 'DISCONNECTED' }));
      startFallbackPolling();
    };
  }, [processStateChanges, startFallbackPolling]);

  useEffect(() => {
    // ✅ 1. Get initial snapshot & measure latency immediately
    fetchData(); 

    // ✅ 2. Then start the real-time subscription
    startSSE();
    
    return () => {
      sseRef.current?.close();
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
    };
  }, [startSSE, fetchData]);

  // ---------------- Filtering ----------------
  const filteredEdges = data?.edges.filter(edge => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    if ((edge.edge_name || '').toLowerCase().includes(q)) return true;
    return edge.links?.some(
      l =>
        (l.isp || '').toLowerCase().includes(q) ||
        (l.interface || '').toLowerCase().includes(q)
    );
  }) || [];

  const connected = filteredEdges.filter(e => e.edge_state === 'CONNECTED').sort(sortByName);
  const offline = filteredEdges.filter(e => e.edge_state === 'OFFLINE').sort(sortByName);
  const partial = filteredEdges.filter(e => e.classification === 'partial').sort(sortByName);

  const dashboardMeta = {
    total: connected.length + offline.length,
    connected: connected.length,
    offline: offline.length,
    partial: partial.length,
    fetchedAt: data?.meta?.fetchedAt
  };

  // ---------------- Render ----------------
  return (
    <div className="app-layout">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <div className="main-content">
        <Header
          currentPage={currentPage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefresh={fetchData}
          notifications={notifications}
          isNotifListVisible={isNotifListVisible}
          setNotifListVisible={setNotifListVisible}
          onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="container">
          {currentPage === 'dashboard' && (
            <DashboardPage
              meta={dashboardMeta}
              connected={connected}
              partial={partial}
              offline={offline}
              onEdgeClick={setSelectedEdge}
            />
          )}

          {currentPage === 'analytics' && (
            <AnalyticsPage
              meta={data?.meta}
              analytics={data?.analytics}
              edges={data?.edges || []}
              onEdgeClick={setSelectedEdge}
            />
          )}

          {currentPage === 'isp-monitor' && (
            <IspMonitorPage analytics={data?.analytics} />
          )}

          {currentPage === 'alerts' && (
            <AlertsPage incidents={incidents} />
          )}

          {/* ✅ Edge History Page */}
          {currentPage === 'edge-history' && (
            <EdgeHistoryPage 
              edge={historyEdge} 
              onBack={handleBackToDash} 
            />
          )}

          {/* ✅ System Health Page */}
          {currentPage === 'system-health' && (
            <SystemHealthPage health={health} />
          )}
        </main>

        <footer className="footer">
          <small>
            Dashboard — last updated:{' '}
            {data ? new Date(data.meta.fetchedAt).toLocaleString() : '—'}
          </small>
        </footer>
      </div>

      {/* Details Modal */}
      {selectedEdge && (
        <DetailsModal 
          edge={selectedEdge} 
          onClose={() => setSelectedEdge(null)} 
          onViewHistory={handleViewHistory} 
        />
      )}

      {/* Toast Notifications */}
      <div id="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </div>
  );
}

export default App;