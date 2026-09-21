import React, { useState } from "react";
import "../styles/BookingModal.css";

const BookingModal = ({ guide, onClose, onConfirmBooking }) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [days, setDays] = useState(1);
  const [travelerName, setTravelerName] = useState("");
  const [phone, setPhone] = useState("");
  const [isBooked, setIsBooked] = useState(false);

  if (!guide) return null;

  const price = guide.price || guide.pricePerDay || 1500;
  const totalAmount = price * days;
  const locationStr = typeof guide.location === "object"
    ? [guide.location?.city, guide.location?.state].filter(Boolean).join(", ")
    : guide.location || "Delhi";
  const guidePhoto = guide.avatar || guide.photo || guide.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80";

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsBooked(true);
    if (onConfirmBooking) {
      onConfirmBooking({
        guide,
        date: selectedDate,
        days,
        travelerName: travelerName || "Guest Explorer",
        totalAmount,
      });
    }
  };

  return (
    <div className="gg-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="gg-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="gg-modal-handle" />

        {isBooked ? (
          <div className="gg-modal-success">
            <div className="gg-modal-success-icon">🎉</div>
            <h3 className="gg-modal-success-title">Guide Booked Successfully!</h3>
            <p className="gg-modal-success-desc">
              Your guide <strong>{guide.name}</strong> will meet you in{" "}
              <strong>{locationStr}</strong> on <strong>{selectedDate}</strong>.
              Confirmation sent to your phone!
            </p>
            <button
              type="button"
              className="gg-modal-confirm-btn"
              onClick={onClose}
              id="booking-done-btn"
            >
              Done & Return Home
            </button>
          </div>
        ) : (
          <>
            <div className="gg-modal-header">
              <div>
                <h3 className="gg-modal-title">Book Local Guide in 10s</h3>
                <p className="gg-modal-subtitle">Direct booking with zero hidden charges</p>
              </div>
              <button
                type="button"
                className="gg-modal-close-btn"
                onClick={onClose}
                aria-label="Close booking modal"
              >
                ✕
              </button>
            </div>

            {/* Guide Info */}
            <div className="gg-modal-guide-box">
              <img
                src={guidePhoto}
                alt={guide.name}
                className="gg-modal-guide-img"
              />
              <div className="gg-modal-guide-details">
                <h4 className="gg-modal-guide-name">{guide.name}</h4>
                <p className="gg-modal-guide-meta">
                  ⭐ {guide.rating || guide.averageRating || 4.8} • {locationStr} • ₹{price}/day
                </p>
              </div>
            </div>


            <form onSubmit={handleSubmit}>
              <div className="gg-modal-field">
                <label className="gg-modal-label">Select Date</label>
                <input
                  type="date"
                  className="gg-modal-input"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>

              <div className="gg-modal-field">
                <label className="gg-modal-label">Duration (Days)</label>
                <select
                  className="gg-modal-input"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                >
                  <option value={1}>1 Day (Full Day Tour)</option>
                  <option value={2}>2 Days (Weekend Tour)</option>
                  <option value={3}>3 Days (Immersive Exploration)</option>
                  <option value={5}>5 Days (Extended Expedition)</option>
                </select>
              </div>

              <div className="gg-modal-field">
                <label className="gg-modal-label">Your Phone Number</label>
                <input
                  type="tel"
                  className="gg-modal-input"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="gg-modal-price-summary">
                <span className="gg-modal-total-label">
                  Total Payable ({days} {days === 1 ? "day" : "days"}):
                </span>
                <span className="gg-modal-total-amount">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <button
                type="submit"
                id="modal-confirm-booking-btn"
                className="gg-modal-confirm-btn"
              >
                <span>⚡ Confirm Booking in 10s</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
