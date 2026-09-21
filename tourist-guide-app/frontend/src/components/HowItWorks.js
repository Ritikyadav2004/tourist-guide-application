import React from "react";
import "../styles/HowItWorks.css";

const HowItWorks = () => {
  const steps = [
    {
      num: 1,
      icon: "🔍",
      title: "Search Destination",
      desc: "Pick your city, dates, and browse verified local storytellers.",
    },
    {
      num: 2,
      icon: "⚡",
      title: "Book in 10 Seconds",
      desc: "Transparent per-day rates with instant booking confirmation.",
    },
    {
      num: 3,
      icon: "🧭",
      title: "Meet Your Guide",
      desc: "Explore secret alleys, authentic food, and culture like a local.",
    },
  ];

  return (
    <section className="gg-how-it-works" id="how-it-works" aria-label="How GullyGuide Works">
      <div className="gg-how-container">
        <div className="gg-how-header">
          <span className="gg-how-badge">Quick & Trustworthy</span>
          <h2 className="gg-how-title">How GullyGuide Works</h2>
          <p className="gg-how-subtitle">
            Find and book your local companion in under 10 seconds
          </p>
        </div>

        <div className="gg-how-steps-flow">
          {/* Connecting line between the steps */}
          <div className="gg-how-connecting-line" aria-hidden="true" />

          {steps.map((step) => (
            <div key={step.num} className="gg-how-step-item">
              <div className="gg-how-icon-wrapper">
                <span className="gg-how-step-icon">{step.icon}</span>
                <span className="gg-how-step-number">{step.num}</span>
              </div>
              <div className="gg-how-step-text">
                <h3 className="gg-how-step-title">{step.title}</h3>
                <p className="gg-how-step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
