import React from "react";
import "../styles/BecomeGuide.css";

const BecomeGuide = ({ onJoinClick }) => {
  return (
    <section className="gg-become-guide-section" aria-label="Become a Tour Guide">
      <div className="gg-become-guide-card">
        <div className="gg-become-guide-content">
          <span className="gg-become-guide-badge">🌟 Guide Community</span>
          <h2 className="gg-become-guide-title">
            Are you a local expert? Earn with GullyGuide.
          </h2>
          <p className="gg-become-guide-desc">
            Turn your passion for your city into reliable income. Connect with eager travelers and set your own terms.
          </p>
        </div>

        <button
          type="button"
          id="become-guide-cta-btn"
          className="gg-become-guide-btn"
          onClick={onJoinClick}
          aria-label="Join GullyGuide as a local guide"
        >
          <span>Join as Guide</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default BecomeGuide;
