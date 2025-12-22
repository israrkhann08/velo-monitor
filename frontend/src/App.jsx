// src/App.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './components/DashboardPage';
import AnalyticsPage from './components/AnalyticsPage';
import IspMonitorPage from './components/IspMonitorPage';
import AlertsPage from './components/AlertsPage';
import DetailsModal from './components/DetailsModal';
import Toast from './components/Toast';

const sortByName = (a, b) => {
  const A = (a.edge_name || "").toLowerCase();
  const B = (b.edge_name || "").toLowerCase();
  return A < B ? -1 : A > B ? 1 : 0;
};

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotifListVisible, setNotifListVisible] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [incidents, setIncidents] = useState([]);

  // Mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs
  const sounds = useRef({});
  const sseRef = useRef(null);
  const fallbackIntervalRef = useRef(null);
  const isAudioUnlocked = useRef(false);
  const dataRef = useRef();
  dataRef.current = data;

  // Navigation
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  // ---------------- Audio ----------------
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

        setIncidents(prev => {
          const updated = [...prev];

          // Calculate duration on recovery
          if (newStatus === 'connected' && oldStatus === 'offline') {
            const lastOffline = [...updated].reverse().find(
              i => i.edge_id === newEdge.edge_id && i.new === 'offline'
            );
            if (lastOffline && !lastOffline.duration) {
              lastOffline.duration = `${Math.round(
                (now - new Date(lastOffline.time)) / 60000
              )} min`;
            }
          }

          updated.unshift({
            edge_id: newEdge.edge_id,
            edge_name: newEdge.edge_name,
            old: oldStatus,
            new: newStatus,
            time: new Date().toISOString(),
            duration: null
          });

          return updated.slice(0, 200);
        });
      }
    });
  }, []);

  // ---------------- Data Fetching ----------------
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/edges');
      if (!res.ok) throw new Error(res.status);
      const newData = await res.json();
      processStateChanges(newData, dataRef.current);
      setData(newData);
    } catch {
      addToast('Failed to load data.', 'error');
    }
  }, [processStateChanges]);

  const startFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) return;
    fetchData();
    fallbackIntervalRef.current = setInterval(fetchData, 30000);
  }, [fetchData]);

  const startSSE = useCallback(() => {
    if (!window.EventSource) {
      startFallbackPolling();
      return;
    }

    sseRef.current = new EventSource('/events');

    sseRef.current.onmessage = (ev) => {
      try {
        const newData = JSON.parse(ev.data);
        if (newData.type !== 'ping') {
          processStateChanges(newData, dataRef.current);
          setData(newData);
        }
      } catch {}
    };

    sseRef.current.onerror = () => {
      sseRef.current?.close();
      sseRef.current = null;
      startFallbackPolling();
    };
  }, [processStateChanges, startFallbackPolling]);

  useEffect(() => {
    startSSE();
    return () => {
      sseRef.current?.close();
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
    };
  }, [startSSE]);

  // ---------------- Derived Data ----------------
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
        </main>

        <footer className="footer">
          <small>
            Dashboard — last updated:{' '}
            {data ? new Date(data.meta.fetchedAt).toLocaleString() : '—'}
          </small>
        </footer>
      </div>

      {selectedEdge && (
        <DetailsModal edge={selectedEdge} onClose={() => setSelectedEdge(null)} />
      )}

      <div id="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </div>
  );
}

export default App;
