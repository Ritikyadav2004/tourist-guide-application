import React from "react";
import "../styles/Header.css";

const DEFAULT_CITIES = [
  "Delhi",
  "Goa",
  "Jaipur",
  "Manali",
  "Chandigarh",
  "Rishikesh",
];

const Header = ({
  selectedCity = "Delhi",
  cities = DEFAULT_CITIES,
  onSelectCity,
  onProfileClick,
}) => {

  return (
    <header className="gg-header" id="main-header">
      <div className="gg-header-container">
        {/* Left: GullyGuide Logo */}
        <div 
          className="gg-logo-link" 
          onClick={() => onSelectCity && onSelectCity("Delhi")}
          title="GullyGuide Home"
          role="button"
          tabIndex={0}
        >
          <div className="gg-logo-icon-box">
            {/* Custom Compass/Pin SVG */}
            <svg
              className="gg-logo-icon"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <polygon
                points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </div>
          <span className="gg-logo-text">
            Gully<span>Guide</span>
          </span>
        </div>

        {/* Center: Location Selector Dropdown */}
        <div className="gg-location-selector" title="Select your destination city">
          <svg
            className="gg-location-pin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <select
            id="header-city-select"
            className="gg-location-select"
            value={selectedCity}
            onChange={(e) => onSelectCity && onSelectCity(e.target.value)}
            aria-label="Select City"
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}

          </select>
          <svg
            className="gg-location-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Right: Profile Icon Avatar */}
        <button
          id="header-profile-btn"
          className="gg-profile-btn"
          onClick={onProfileClick}
          aria-label="User profile"
          type="button"
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            alt="User profile avatar"
            className="gg-profile-avatar"
            onError={(e) => {
              e.target.style.display = "none";
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = "block";
              }
            }}
          />
          <span className="gg-profile-initial" style={{ display: "none" }}>
            U
          </span>
          <span className="gg-profile-online-badge" title="Active"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
