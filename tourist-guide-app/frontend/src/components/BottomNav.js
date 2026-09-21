import React from "react";
import "../styles/BottomNav.css";

const TABS = [
  {
    id: "home",
    label: "Home",
    icon: (
      <svg className="gg-nav-icon" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "explore",
    label: "Explore",
    icon: (
      <svg className="gg-nav-icon" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    id: "bookings",
    label: "Bookings",
    badge: "1",
    icon: (
      <svg className="gg-nav-icon" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "chat",
    label: "Chat",
    badge: "2",
    icon: (
      <svg className="gg-nav-icon" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg className="gg-nav-icon" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const BottomNav = ({ activeTab = "home", onTabChange }) => {
  return (
    <nav className="gg-bottom-nav" id="bottom-navigation" aria-label="Mobile Navigation Bar">
      <div className="gg-bottom-nav-container">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-item-${tab.id}`}
              type="button"
              className={`gg-nav-item ${isActive ? "active" : ""}`}
              onClick={() => onTabChange && onTabChange(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="gg-nav-icon-wrapper">
                {tab.icon}
                {tab.badge && <span className="gg-nav-badge">{tab.badge}</span>}
              </div>
              <span className="gg-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
