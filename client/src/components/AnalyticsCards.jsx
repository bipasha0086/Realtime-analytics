import React from 'react';
import { Line } from 'react-chartjs-2';
import { FaDollarSign, FaMicrochip, FaExclamationTriangle, FaUsers, FaExchangeAlt, FaClock } from 'react-icons/fa';
import './AnalyticsCards.css';

const cardConfig = [
  {
    key: 'Sales',
    icon: <FaDollarSign size={28} color="#22d3ee" />,
    gradient: 'linear-gradient(135deg, #38bdf8 0%, #22d3ee 100%)',
    chartColor: '#22d3ee',
  },
  {
    key: 'CPU Usage',
    icon: <FaMicrochip size={28} color="#fbbf24" />,
    gradient: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)',
    chartColor: '#fbbf24',
  },
  {
    key: 'Error Rate',
    icon: <FaExclamationTriangle size={28} color="#fb7185" />,
    gradient: 'linear-gradient(135deg, #fca5a5 0%, #fb7185 100%)',
    chartColor: '#fb7185',
  },
  {
    key: 'Active Users',
    icon: <FaUsers size={28} color="#f472b6" />,
    gradient: 'linear-gradient(135deg, #f472b6 0%, #fb923c 100%)',
    chartColor: '#fb923c',
  },
  {
    key: 'Transactions',
    icon: <FaExchangeAlt size={28} color="#a78bfa" />,
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #06b6d4 100%)',
    chartColor: '#06b6d4',
  },
  {
    key: 'Response Time',
    icon: <FaClock size={28} color="#fbbf24" />,
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #fb923c 100%)',
    chartColor: '#fbbf24',
  },
];

export default function AnalyticsCards({ metrics, history, fetchMetricStats, showStats, stats }) {
  // First row: Sales, CPU Usage, Error Rate
  // Second row: Active Users, Transactions, Response Time
  const firstRow = cardConfig.slice(0, 3);
  const secondRow = cardConfig.slice(3, 6);

  const getChartData = (metricName, color) => {
    const data = history[metricName] || [];
    return {
      labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
      datasets: [
        {
          label: metricName,
          data: data.map(d => d.value),
          fill: false,
          borderColor: color,
          backgroundColor: color,
          tension: 0.3,
          pointRadius: 0,
        },
      ],
    };
  };

  return (
    <div className="analytics-cards-section">
      <div className="analytics-cards-row">
        {firstRow.map(cfg => (
          <div className="analytics-card" style={{ background: cfg.gradient }} key={cfg.key}>
            <div className="analytics-card-top">
              <span className="analytics-card-icon">{cfg.icon}</span>
              <button className="analytics-card-refresh" onClick={() => fetchMetricStats(cfg.key)} title="Refresh">
                ↻
              </button>
            </div>
            <div className="analytics-card-title">{cfg.key}</div>
            <div className="analytics-card-value">{metrics[cfg.key]?.value ?? '--'}</div>
            {showStats && stats[cfg.key] && (
              <div className="analytics-card-stats">
                <span>Min: {stats[cfg.key].min?.toFixed(2)}</span>
                <span>Max: {stats[cfg.key].max?.toFixed(2)}</span>
                <span>Avg: {stats[cfg.key].avg?.toFixed(2)}</span>
              </div>
            )}
            <div className="analytics-card-chart">
              <Line
                data={getChartData(cfg.key, cfg.chartColor)}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: false },
                    y: { display: false },
                  },
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="analytics-cards-row">
        {secondRow.map(cfg => (
          <div className="analytics-card" style={{ background: cfg.gradient }} key={cfg.key}>
            <div className="analytics-card-top">
              <span className="analytics-card-icon">{cfg.icon}</span>
              <button className="analytics-card-refresh" onClick={() => fetchMetricStats(cfg.key)} title="Refresh">
                ↻
              </button>
            </div>
            <div className="analytics-card-title">{cfg.key}</div>
            <div className="analytics-card-value">{metrics[cfg.key]?.value ?? '--'}</div>
            {showStats && stats[cfg.key] && (
              <div className="analytics-card-stats">
                <span>Min: {stats[cfg.key].min?.toFixed(2)}</span>
                <span>Max: {stats[cfg.key].max?.toFixed(2)}</span>
                <span>Avg: {stats[cfg.key].avg?.toFixed(2)}</span>
              </div>
            )}
            <div className="analytics-card-chart">
              <Line
                data={getChartData(cfg.key, cfg.chartColor)}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: false },
                    y: { display: false },
                  },
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
