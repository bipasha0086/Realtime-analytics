import React from 'react';
import WeatherWidget from './WeatherWidget';
import './DashboardHeader.css';

export default function DashboardHeader({ now, selectedTimeRange, setSelectedTimeRange, showStats, setShowStats }) {
  return (
    <header className="main-header-gradient">
      <div className="main-header-left">
        <h1 className="main-header-title">Real-time Analytics Dashboard</h1>
        <div className="main-header-greeting">Hi User <span role="img" aria-label="wave">👋</span></div>
      </div>
      <div className="main-header-center">
        <WeatherWidget />
      </div>
      <div className="main-header-right">
        <div className="main-header-controls">
          <select
            value={selectedTimeRange}
            onChange={e => setSelectedTimeRange(e.target.value)}
            className="main-header-select"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={() => setShowStats(!showStats)}
            className="main-header-stats-btn"
          >
            {showStats ? 'Hide Statistics' : 'Show Statistics'}
          </button>
        </div>
      </div>
    </header>
  );
}
