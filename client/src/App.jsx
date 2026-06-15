import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import './App.css';
import './components/Sidebar.css';
import './components/DashboardHeader.css';

function App() {
  // initialize theme from localStorage or prefers-color-scheme
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('dashboard_theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch (e) {}
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  // Apply theme class to document root so :root.dark / :root.light CSS works
  useEffect(() => {
    const root = document.documentElement;
    // set exact class so attribute-equals selectors also match
    root.className = theme;
    try { localStorage.setItem('dashboard_theme', theme); } catch (e) {}
  }, [theme]);

  return (
    <div className={`app ${theme}`}>
      <div className="theme-toggle">
        <button onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <Dashboard />
      </div>
    </div>
  );
}

export default App;
