import React from "react";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="gg-footer" role="contentinfo">
      <div className="gg-footer-container">
        <div className="gg-footer-top">
          {/* Brand info */}
          <div className="gg-footer-brand">
            <div className="gg-footer-logo">
              Gully<span>Guide</span>
            </div>
            <p className="gg-footer-tagline">
              Connecting curious travelers with verified local storytellers and cultural guides across India.
            </p>
          </div>

          {/* Quick links */}
          <div className="gg-footer-links-grid">
            <div className="gg-footer-links-group">
              <span className="gg-footer-links-title">Explore</span>
              <a href="#hero-slider" className="gg-footer-link">Top Destinations</a>
              <a href="#top-guides" className="gg-footer-link">Verified Guides</a>
              <a href="#how-it-works" className="gg-footer-link">How it Works</a>
            </div>

            <div className="gg-footer-links-group">
              <span className="gg-footer-links-title">Legal & Trust</span>
              <a href="#terms" className="gg-footer-link">Terms of Service</a>
              <a href="#privacy" className="gg-footer-link">Privacy Policy</a>
              <a href="#safety" className="gg-footer-link">Safety Guidelines</a>
            </div>

            <div className="gg-footer-links-group">
              <span className="gg-footer-links-title">Support</span>
              <a href="#contact" className="gg-footer-link">Contact 24/7</a>
              <a href="#faq" className="gg-footer-link">FAQ & Help</a>
              <a href="#community" className="gg-footer-link">Community</a>
            </div>
          </div>

          {/* Social media icons */}
          <div className="gg-footer-socials">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="gg-social-btn" aria-label="Instagram">
              📸
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="gg-social-btn" aria-label="Twitter">
              🐦
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="gg-social-btn" aria-label="Facebook">
              📘
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="gg-social-btn" aria-label="YouTube">
              ▶️
            </a>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="gg-footer-bottom">
          <span>© 2026 GullyGuide Technologies Pvt. Ltd. All rights reserved.</span>
          <span>Made with ❤️ for Indian Heritage & Culture</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
