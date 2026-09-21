import React from "react";
import "../styles/CityChips.css";

const DEFAULT_CITIES = [
  "Delhi",
  "Goa",
  "Jaipur",
  "Manali",
  "Chandigarh",
  "Rishikesh",
];

const CITY_ICONS = {
  Delhi: "🏛️",
  Goa: "🏖️",
  Jaipur: "🏰",
  Manali: "🏔️",
  Chandigarh: "🌿",
  Rishikesh: "🧘",
};

const CityChips = ({
  selectedCity = "Delhi",
  cities = DEFAULT_CITIES,
  onSelectCity,
}) => {
  const displayCities = Array.isArray(cities) && cities.length > 0 ? cities : DEFAULT_CITIES;

  return (
    <section className="gg-city-chips-section" aria-label="Filter Guides by City">
      <div className="gg-city-chips-header">
        <span className="gg-city-chips-title">Popular Destinations</span>
      </div>

      <div className="gg-city-chips-scroll" role="tablist">
        {displayCities.map((city) => {
          const isActive = (selectedCity || "").toLowerCase() === city.toLowerCase();
          return (
            <button
              key={city}
              id={`chip-${city.toLowerCase()}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`gg-city-chip ${isActive ? "active" : ""}`}
              onClick={() => onSelectCity && onSelectCity(city)}
            >
              <span className="gg-city-chip-icon">{CITY_ICONS[city] || "📍"}</span>
              <span>{city}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CityChips;
