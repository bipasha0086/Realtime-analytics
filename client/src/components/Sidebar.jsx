import React from 'react';
import './Sidebar.css';

export default function Sidebar({ now }) {
  // Format: Saturday 8 November 2025, 3:26:16 pm
  const formattedDate = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <aside className="sidebar-gradient">
      <div className="sidebar-top">
        <div className="avatar-circle">
          <img src="https://ui-avatars.com/api/?name=U&background=7a3ce7&color=fff&rounded=true" alt="User Avatar" />
        </div>
        <div className="sidebar-welcome">Welcome!</div>
      </div>
      <div className="sidebar-datetime">
        <div className="sidebar-date">{formattedDate}</div>
        <div className="sidebar-time">{formattedTime}</div>
      </div>
    </aside>
  );
}
