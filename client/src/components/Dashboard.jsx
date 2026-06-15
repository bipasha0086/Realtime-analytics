import React, { useEffect, useState } from 'react';
import './DashboardStatic.css';

const metricsConfig = [
  { key: 'CPU Usage', unit: '%', accent: 'blue', min: 10, max: 90 },
  { key: 'Error Rate', unit: '%', accent: 'orange', min: 0, max: 10 },
  { key: 'Transactions', unit: ' tx/s', accent: 'cyan', min: 20, max: 200 },
  { key: 'Response Time', unit: ' ms', accent: 'pink', min: 50, max: 600 },
  { key: 'Active Users', unit: '', accent: 'blue', min: 40, max: 1000 },
  { key: 'Sales', unit: '$', accent: 'cyan', min: 100, max: 6000 },
];

function createSparklineSVG(values, w = 180, h = 36) {
  if (!values || values.length < 2) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" width="100%"><polyline points="${points}" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export default function Dashboard() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState({ temp: '--', cond: '--', hum: '--', wind: '--' });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [metricsState, setMetricsState] = useState({});
  const [alerts, setAlerts] = useState(() => JSON.parse(localStorage.getItem('alerts_demo_v1') || '[]'));

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Simulated weather
  useEffect(() => {
    const update = () => {
      const conds = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Clear'];
      const cond = conds[Math.floor(Math.random() * conds.length)];
      const temp = Math.floor(Math.random() * 18 + 10);
      const hum = Math.floor(Math.random() * 50 + 30);
      const wind = Math.floor(Math.random() * 20 + 2);
      setWeather({ temp, cond, hum, wind });
    };
    update();
    const id = setInterval(update, 300000);
    return () => clearInterval(id);
  }, []);

  // Init cards
  useEffect(() => {
    const init = {};
    metricsConfig.forEach((m) => {
      init[m.key] = { history: Array.from({ length: 12 }, () => Math.round(Math.random() * (m.max - m.min) + m.min)), value: 0 };
    });
    setMetricsState(init);
  }, []);

  // Update metrics periodically
  useEffect(() => {
    const tick = () => {
      setMetricsState((prev) => {
        const next = { ...prev };
        metricsConfig.forEach((cfg) => {
          const st = next[cfg.key] || { history: [] };
          const last = st.history.length ? st.history[st.history.length - 1] : Math.floor((cfg.min + cfg.max) / 2);
          const delta = Math.round((Math.random() - 0.45) * (cfg.max - cfg.min) / 30);
          const nv = Math.max(cfg.min, Math.min(cfg.max, last + delta));
          st.history = [...(st.history || []), nv].slice(-30);
          st.value = nv;
          next[cfg.key] = st;
        });
        return next;
      });
    };
    const id = setInterval(tick, 1500);
    tick();
    return () => clearInterval(id);
  }, []);

  // Alerts persistence
  useEffect(() => {
    localStorage.setItem('alerts_demo_v1', JSON.stringify(alerts));
  }, [alerts]);

  const createAlert = (metric, threshold, condition) => {
    const id = 'a_' + Date.now();
    setAlerts((prev) => [...prev, { id, metric, threshold, condition, created: Date.now() }]);
  };

  const resolveAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Simple check to flash card when alert fires
  useEffect(() => {
    const id = setInterval(() => {
      alerts.forEach((a) => {
        const st = metricsState[a.metric];
        if (!st) return;
        const val = st.value;
        if ((a.condition === 'above' && val > a.threshold) || (a.condition === 'below' && val < a.threshold)) {
          const el = document.querySelector('.card[data-key="' + a.metric + '"]');
          if (el) {
            el.classList.add('alert-flash');
            setTimeout(() => el.classList.remove('alert-flash'), 1600);
          }
        }
      });
    }, 1200);
    return () => clearInterval(id);
  }, [alerts, metricsState]);

  useEffect(() => {
    // Observe sections and update activeSection state when they enter view
    const secs = Array.from(document.querySelectorAll('.content-section'));
    if (!secs.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { root: null, rootMargin: '-35% 0px -35% 0px', threshold: 0.1 });
    secs.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-inner">
          <div className="profile">
            <div className="avatar">U</div>
            <div className="profile-info">
              <div className="username">User</div>
              <div className="local-date">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div className="local-time">{now.toLocaleTimeString()}</div>
            </div>
          </div>

          <nav className="nav">
            <button className={activeSection === 'dashboard' ? 'nav-btn active' : 'nav-btn'} onClick={() => scrollTo('dashboard')}>Dashboard</button>
            <button className={activeSection === 'analytics' ? 'nav-btn active' : 'nav-btn'} onClick={() => scrollTo('analytics')}>Analytics</button>
            <button className={activeSection === 'alerts' ? 'nav-btn active' : 'nav-btn'} onClick={() => scrollTo('alerts')}>Alerts</button>
            <button className={activeSection === 'settings' ? 'nav-btn active' : 'nav-btn'} onClick={() => scrollTo('settings')}>Settings</button>
          </nav>

          <div className="sidebar-footer">v1.0 • Offline</div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="title">Real-time Analytics</h1>
            <div className="greeting">Hi User 👋</div>
          </div>
          <div className="weather">
            <div className="temp">{weather.temp}°C</div>
            <div className="cond">{weather.cond}</div>
            <div className="meta">Humidity: {weather.hum}% • Wind: {weather.wind} km/h</div>
          </div>
          <div className="topbar-right">
            <label className="range-label">
              Range
              <select defaultValue="1h">
                <option value="1h">1h</option>
                <option value="6h">6h</option>
                <option value="24h">24h</option>
              </select>
            </label>
            <button className="btn btn-ghost">Toggle Stats</button>
          </div>
        </header>

  <section id="dashboard" className={activeSection === 'dashboard' ? 'content-section active-section' : 'content-section'}>
          <div className="cards-grid">
            {metricsConfig.map((cfg) => (
              <div key={cfg.key} className={`card ${cfg.accent}`} data-key={cfg.key}>
                <div className="label">{cfg.key}</div>
                <div className="value">{metricsState[cfg.key]?.value ?? '--'}{cfg.unit}</div>
                <div className="small-muted">Updated: {metricsState[cfg.key] && metricsState[cfg.key].history.length ? new Date().toLocaleTimeString() : '--'}</div>
                <div className="spark" dangerouslySetInnerHTML={{ __html: createSparklineSVG((metricsState[cfg.key]?.history) || [0]) }} />
              </div>
            ))}
          </div>

          <section className="alerts-section">
            <div className="alerts-form">
              <h2>Alert Manager</h2>
              <div className="form-row">
                <input id="alert-metric" placeholder="Metric name (e.g. CPU Usage)" />
                <input id="alert-threshold" type="number" placeholder="Threshold" />
                <select id="alert-condition">
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
                <button className="btn btn-primary" onClick={() => {
                  const metric = document.getElementById('alert-metric').value.trim();
                  const threshold = Number(document.getElementById('alert-threshold').value);
                  const condition = document.getElementById('alert-condition').value;
                  if (!metric || !threshold) return alert('Please enter metric and threshold');
                  createAlert(metric, threshold, condition);
                  document.getElementById('alert-metric').value = '';
                  document.getElementById('alert-threshold').value = '';
                }}>Create Alert</button>
              </div>
            </div>

            <div className="alerts-list">
              <h3>Active Alerts</h3>
              <div>
                {alerts.length === 0 ? <div className="no-alerts">No active alerts</div> : alerts.map(a => (
                  <div className="alert-item" key={a.id}>
                    <div>
                      <strong>{a.metric}</strong> • {a.condition} {a.threshold}
                      <div className="meta">Created: {new Date(a.created).toLocaleString()}</div>
                    </div>
                    <button className="resolve-btn" onClick={() => resolveAlert(a.id)}>Resolve</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>

  <section id="analytics" className={activeSection === 'analytics' ? 'content-section active-section' : 'content-section'}>
          <div className="analytics-panel">
            <h2>Analytics Overview</h2>
            <p className="muted">Quick charts and insights (demo)</p>
            <div className="analytics-grid">
              {metricsConfig.slice(0,4).map(cfg => (
                <div className="analytics-panel" key={cfg.key}>
                  <h3>{cfg.key}</h3>
                  <p className="muted">Live small chart</p>
                  <div style={{height:80}} dangerouslySetInnerHTML={{__html: createSparklineSVG((metricsState[cfg.key]?.history) || [0],400,80)}} />
                </div>
              ))}
            </div>
          </div>
        </section>

  <section id="alerts" className={activeSection === 'alerts' ? 'content-section active-section' : 'content-section'}>
          <div className="center-note">
            <h2>Alerts Center</h2>
            <p className="muted">Manage alerts created from the dashboard below.</p>
          </div>
        </section>

  <section id="settings" className={activeSection === 'settings' ? 'content-section active-section' : 'content-section'}>
          <div className="center-note">
            <h2>Settings</h2>
            <p className="muted">Theme and preferences — demo.</p>
          </div>
        </section>
      </main>
    </div>
  );
}