import React, { useState, useEffect } from "react";
import "../styles/HeroSlider.css";

// Using the project's established destination slides from Carasol.jsx
const SLIDES = [
  {
    id: 1,
    badge: "🔥 TRENDING DESTINATION",
    heading: "Discover the Unseen",
    subheading: "Book verified local guides who reveal hidden alleys & untold heritage in 10 seconds.",
    image: "https://images.unsplash.com/photo-1587135941948-670b381f08ce?w=1920&auto=format&fit=crop&q=85",
    defaultCity: "Delhi",
  },
  {
    id: 2,
    badge: "🌴 ESCAPE THE ORDINARY",
    heading: "Live Goa Beyond Beaches",
    subheading: "Wander Fontainhas Latin Quarter, secret coves & authentic Goan kitchens.",
    image: "https://plus.unsplash.com/premium_photo-1697729701846-e34563b06d47?w=1920&auto=format&fit=crop&q=85",
    defaultCity: "Goa",
  },
  {
    id: 3,
    badge: "🏔️ HIMALAYAN ESCAPES",
    heading: "Trek With Local Natives",
    subheading: "Discover hidden pine ridges, ancient apple orchards & serene mountain streams.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&auto=format&fit=crop&q=85",
    defaultCity: "Manali",
  },
];

const HeroSlider = ({ onSearch }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [travelers, setTravelers] = useState("2 Travelers");
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  // Auto-play every 4 seconds
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e) => {
    setIsPaused(true);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX || !touchEndX) return;

    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    } else if (distance < -minSwipeDistance) {
      setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  };

  const handleSearchSubmit = (e) => {
    e && e.preventDefault();
    if (onSearch) {
      onSearch(destination.trim() || SLIDES[currentIndex].defaultCity, {
        date: travelDate,
        travelers,
      });
    }
  };

  return (
    <section
      className="gg-hero-slider"
      id="hero-slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Travel Destinations Hero Slider"
    >
      {/* Slider Track */}
      <div
        className="gg-slider-track"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {SLIDES.map((slide) => (
          <div
            key={slide.id}
            className="gg-slide"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            {/* Gradient Overlay only at bottom for crystal clear text readability */}
            <div className="gg-slide-overlay" />

            <div className="gg-slide-content">
              <span className="gg-slide-badge">{slide.badge}</span>
              <h1 className="gg-slide-heading">{slide.heading}</h1>
              <p className="gg-slide-subheading">{slide.subheading}</p>

              {/* Pure White Search Bar with soft box-shadow (Height 52px+) */}
              <form
                className="gg-search-overlay"
                onSubmit={handleSearchSubmit}
                role="search"
              >
                {/* 1. Destination Input */}
                <div className="gg-search-input-wrapper">
                  <svg
                    className="gg-search-icon"
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
                  <input
                    type="text"
                    className="gg-search-input"
                    id="hero-destination-input"
                    placeholder="Where to? (e.g. Goa, Manali, Delhi)"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    aria-label="Destination City"
                  />
                </div>

                <div className="gg-search-divider" />

                {/* 2. Date Picker */}
                <div className="gg-search-date-wrapper">
                  <svg
                    className="gg-search-date-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <input
                    type="date"
                    className="gg-search-date-native"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    aria-label="Travel Date"
                  />
                </div>

                <div className="gg-search-divider" />

                {/* 3. Traveler Count */}
                <div className="gg-search-travelers-wrapper">
                  <svg
                    className="gg-search-travelers-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <select
                    className="gg-search-travelers-select"
                    value={travelers}
                    onChange={(e) => setTravelers(e.target.value)}
                    aria-label="Number of Travelers"
                  >
                    <option value="1 Traveler">1 Traveler</option>
                    <option value="2 Travelers">2 Travelers</option>
                    <option value="3-4 Travelers">3-4 Travelers</option>
                    <option value="5+ Group">5+ Group</option>
                  </select>
                </div>

                {/* 4. Orange CTA Search Button */}
                <button
                  type="submit"
                  id="hero-search-submit-btn"
                  className="gg-search-submit-btn"
                  aria-label="Search Guides"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Search</span>
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Arrows */}
      <button
        type="button"
        className="gg-slider-arrow prev"
        onClick={handlePrev}
        aria-label="Previous Slide"
      >
        ‹
      </button>
      <button
        type="button"
        className="gg-slider-arrow next"
        onClick={handleNext}
        aria-label="Next Slide"
      >
        ›
      </button>

      {/* Highly visible slider dots */}
      <div className="gg-slider-dots">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`gg-slider-dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
