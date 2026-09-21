import React from "react";
import "../styles/TrustRow.css";

const TrustRow = () => {
  return (
    <aside className="gg-trust-row" aria-label="Trust and Reliability Features">
      <div className="gg-trust-container">
        <div className="gg-trust-item">
          <span className="gg-trust-icon">✅</span>
          <span>Verified Guides</span>
        </div>
        <span className="gg-trust-divider" aria-hidden="true" />

        <div className="gg-trust-item">
          <span className="gg-trust-icon">🔒</span>
          <span>Secure Payments</span>
        </div>
        <span className="gg-trust-divider" aria-hidden="true" />

        <div className="gg-trust-item">
          <span className="gg-trust-icon">⭐</span>
          <span>4.8 Avg Rating</span>
        </div>
        <span className="gg-trust-divider" aria-hidden="true" />

        <div className="gg-trust-item">
          <span className="gg-trust-icon">💬</span>
          <span>24/7 Support</span>
        </div>
      </div>
    </aside>
  );
};

export default TrustRow;
