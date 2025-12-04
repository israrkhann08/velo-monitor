# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



# folder structure
frontend/
├── node_modules/             # Installed dependencies
├── public/
│   ├── sounds/
│   │   ├── connected.mp3
│   │   ├── offline.mp3
│   │   └── partial.mp3
│   ├── pel.png
│   └── vite.svg
├── src/
│   ├── assets/               # Static assets imported via JS (optional)
│   ├── components/
│   │   ├── AnalyticsPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── DetailsModal.jsx
│   │   ├── EdgeItem.jsx
│   │   ├── EdgeList.jsx
│   │   ├── Header.jsx
│   │   ├── Icons.jsx
│   │   ├── IspMonitorPage.jsx
│   │   ├── Sidebar.jsx
│   │   ├── SummaryCard.jsx
│   │   └── Toast.jsx
│   ├── App.css               # (Can be empty if using index.css mostly)
│   ├── App.jsx
│   ├── index.css             # Main global styles (The big CSS file provided)
│   └── main.jsx
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── README.md
└── vite.config.js

documentation


Here is the comprehensive documentation for the Frontend of your VeloCloud Monitoring System.
VeloCloud Edge Monitoring Frontend
1. Project Overview
This is a React-based Single Page Application (SPA) built with Vite. It serves as the visual dashboard for the backend monitoring system. It provides real-time visualization of network edge statuses, ISP performance analytics, and audio-visual alerts for network events.
Key Features:
Real-Time Updates: Connects via Server-Sent Events (SSE) to receive live updates without page reloads.
Audio Alerts: Plays specific sound effects (Success, Warning, Error) when edge statuses change.
Interactive Analytics: Uses recharts to visualize ISP stability and Edge health distribution.
Responsive Design: Fully mobile-compatible with a collapsible sidebar and responsive grids.
2. Tech Stack & Dependencies
Framework: React 18
Build Tool: Vite
Visualization: Recharts (Bar charts, Pie charts)
Styling: Native CSS with CSS Variables
Data Transport: Native fetch (REST) and EventSource (SSE)
3. Folder Structure
code
Text
frontend/
├── public/                  # Static assets served directly
│   └── sounds/              # Audio files (connected.mp3, offline.mp3, etc.)
├── src/
│   ├── components/          # Reusable UI components and Page views
│   ├── App.jsx              # Main Controller (State, Routing, SSE logic)
│   ├── index.css            # Global Styles and Media Queries
│   └── main.jsx             # Entry point
├── vite.config.js           # Vite configuration (Proxy setup)
└── package.json
4. Setup & Installation
Prerequisites
Ensure the Backend is running on port 3000.
Installation
Navigate to the frontend folder:
code
Bash
cd frontend
Install dependencies:
code
Bash
npm install
Start the development server:
code
Bash
npm run dev
The app will generally start at http://localhost:5173.
5. Architecture & Data Flow
A. The Controller (App.jsx)
App.jsx acts as the central brain of the application. It does not use external state management (like Redux) but relies on Lifted State.
Data Fetching Strategy:
Initial Load: Calls fetch('/api/edges') to get immediate data.
Real-Time: Establishes an SSE connection to /events.
Fallback: If SSE fails, it falls back to polling /api/edges every 30 seconds.
State Change Detection:
The processStateChanges function compares oldData vs newData.
If an Edge changes status (e.g., Connected -> Offline), it triggers:
Notification: Adds an entry to the notification dropdown.
Toast: Shows a popup on the top right.
Audio: Plays the corresponding .mp3 file from public/sounds.
Routing:
Uses simple state-based routing (currentPage state variable) to switch between 'dashboard', 'analytics', and 'isp-monitor'.
B. Proxy Configuration (vite.config.js)
To avoid CORS issues during development, requests are proxied to the backend:
code
JavaScript
server: {
  proxy: {
    '/api': { target: 'http://localhost:3000', ... },
    '/events': { target: 'http://localhost:3000', ... },
  },
}
6. Component Reference
Pages (Views)
Component	Description
DashboardPage.jsx	The default view. Shows summary cards and three columns of Edges (Connected, Partial, Offline).
AnalyticsPage.jsx	Displays charts using recharts. Includes a Pie Chart for health distribution and a Bar Chart for ISP usage.
IspMonitorPage.jsx	Dedicated view for ISP reliability. Shows a stacked bar chart (Stable vs Unstable links) and a detailed reliability percentage table.
UI Components
Component	Description
Sidebar.jsx	Navigation menu. On mobile, it acts as a slide-out drawer.
Header.jsx	Top bar containing the page title, global search bar, refresh button, and notification bell.
EdgeList.jsx	A column component used in the Dashboard to render a list of EdgeItems.
EdgeItem.jsx	A single card representing an Edge. Clickable to open the Details Modal.
DetailsModal.jsx	A popup overlay showing detailed interface/link statistics for a specific edge.
Toast.jsx	Ephemeral notification bubbles that appear in the top-right corner.
7. Styling (index.css)
The application uses CSS Variables for consistent theming.
Key Variables:
--bg-main: Light gray background for the app.
--bg-panel: White background for cards and sidebars.
--success, --warning, --danger: Standard bootstrap-like colors for status indication.
Responsiveness:
Desktop (>1024px): 3-column dashboard, always-visible sidebar.
Tablet (<768px): Sidebar becomes a hidden drawer (toggled via hamburger menu). Dashboard columns stack vertically.
Mobile (<480px): Search bar hides, fonts resize, and grids collapse to single columns.
8. Logic Breakdown (Key Files)
src/App.jsx (Audio Logic)
Browsers block auto-playing audio. The app uses an unlockAudio strategy:
code
JavaScript
const unlockAudio = () => {
  // Plays and immediately pauses all sounds on the first user click anywhere
  // This "unlocks" the ability to play them programmatically later
  Object.values(sounds.current).forEach(s => s.play().then(() => s.pause())...);
}
src/components/IspMonitorPage.jsx (Calculations)
It calculates reliability purely on the frontend based on the analytics prop passed from the backend:
code
JavaScript
// Formula used in the table
const reliability = (isp.stable / isp.total) * 100;
9. How to Modify
To change the polling speed:
Modify the setInterval time in App.jsx (currently 30000ms) for the fallback logic.
To add new pages:
Create a component in components/.
Add a route key in Sidebar.jsx.
Add a conditional render block in App.jsx.
To change colors:
Update the :root variables in index.css.
10. Troubleshooting
"Loading..." forever:
Check if the backend is running.
Check the browser console (F12). If you see 404s for /api/edges, ensure the proxy in vite.config.js matches your backend port.
No Audio:
You must interact with the page (click anywhere) at least once after loading for audio to initialize.
Mobile Menu won't open:
Ensure the screen width is below 768px. The hamburger icon is hidden on desktop.