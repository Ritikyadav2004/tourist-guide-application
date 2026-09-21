import React, { useMemo } from "react";
import "../styles/TopGuides.css";
import { isCompleteProfile } from "../utils/guideFilter";

export { isCompleteProfile };

const formatLocation = (loc) => {
  if (!loc) return "Location not provided";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object") {
    const parts = [loc.city, loc.state, loc.country].filter(Boolean);
    return parts.length ? parts.join(", ") : "Location not provided";
  }
  return "Location not provided";
};

const getGuideImage = (guide) => {
  const src = guide?.avatar || guide?.photo || guide?.image;
  if (!src) return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";
  if (src.startsWith("http") || src.startsWith("data:")) return src;
  return `http://localhost:5000/uploads/${src}`;
};

const TopGuides = ({
  selectedCity = "Delhi",
  guidesData = [],
  onBookGuide,
}) => {
  // Filter complete profiles and match by city
  const { filteredCityGuides } = useMemo(() => {
    const validProfiles = (guidesData || []).filter(isCompleteProfile);

    const cityMatches = validProfiles.filter((g) => {
      const locStr = formatLocation(g.location).toLowerCase();
      const target = (selectedCity || "").toLowerCase();
      return locStr.includes(target) || target.includes(locStr);
    });

    return {
      filteredCityGuides: cityMatches.length > 0 ? cityMatches : validProfiles,
    };
  }, [guidesData, selectedCity]);

  return (
    <section className="gg-top-guides-section" id="top-guides" aria-label={`Top Tour Guides in ${selectedCity}`}>
      {/* Section Header */}
      <div className="gg-top-guides-header">
        <div className="gg-top-guides-title-box">
          <h2 className="gg-top-guides-title">Top Guides in {selectedCity}</h2>
          <p className="gg-top-guides-subtitle">
            Handpicked, verified locals with authentic stories
          </p>
        </div>
        <span className="gg-top-guides-count">
          {filteredCityGuides.length} Verified
        </span>
      </div>

      {/* Horizontal Scroll Cards */}
      {filteredCityGuides.length > 0 ? (
        <div className="gg-guides-cards-scroll" role="region" aria-label="Guides List">
          {filteredCityGuides.map((guide, idx) => {
            const guideId = guide._id || guide.id || `guide-${idx}`;
            const price = guide.price || guide.pricePerDay || 1500;
            const rating = Number(guide.rating || guide.averageRating || 4.8);
            const reviewCount =
              guide.reviewsCount ||
              guide.numReviews ||
              (Array.isArray(guide.reviews) ? guide.reviews.length : 120);
            const isVerified = guide.isVerified !== false && guide.verified !== false;
            const languages = Array.isArray(guide.languages)
              ? guide.languages.join(", ")
              : guide.languages || "English, Hindi";

            return (
              <article key={guideId} className="gg-guide-card" id={`guide-card-${guideId}`}>
                {/* Top Section: Photo + Name + Verified Badge + Rating Row below */}
                <div className="gg-guide-card-top">
                  <div className="gg-guide-photo-wrapper">
                    <img
                      src={getGuideImage(guide)}
                      alt={`${guide.name} - Tour Guide`}
                      className="gg-guide-photo"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
                      }}
                    />
                  </div>

                  <div className="gg-guide-info">
                    {/* Name + Verified Checkmark Badge next to name */}
                    <div className="gg-guide-name-row">
                      <h3 className="gg-guide-name" title={guide.name}>
                        {guide.name}
                      </h3>
                      {isVerified && (
                        <span className="gg-guide-name-badge" title="Verified Local Guide">
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </span>
                      )}
                    </div>

                    {/* Rating layout: Star + Rating + Review count in one clean row below name */}
                    <div className="gg-guide-rating-row">
                      <span className="gg-guide-star">⭐</span>
                      <span className="gg-guide-rating-val">{rating.toFixed(1)}</span>
                      <span className="gg-guide-reviews">({reviewCount}+ reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Location / Languages info */}
                <div className="gg-guide-meta-row">
                  <svg
                    className="gg-guide-meta-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="gg-guide-meta-text">
                    {formatLocation(guide.location)} • {languages}
                  </span>
                </div>

                {/* Footer: Increased price font size & Orange Book Button */}
                <div className="gg-guide-footer">
                  <div className="gg-guide-price-box">
                    <span className="gg-guide-price-label">Price per day</span>
                    <div className="gg-guide-price-value">
                      ₹{price.toLocaleString("en-IN")}
                      <span> / day</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    id={`book-btn-${guideId}`}
                    className="gg-guide-book-btn"
                    onClick={() => onBookGuide && onBookGuide(guide)}
                    aria-label={`Book ${guide.name} for ₹${price} per day`}
                  >
                    Book
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="gg-guides-empty">
          <h4>No guides available right now in {selectedCity}</h4>
          <p>Try choosing another destination chip to explore available guides.</p>
        </div>
      )}
    </section>
  );
};

export default TopGuides;
