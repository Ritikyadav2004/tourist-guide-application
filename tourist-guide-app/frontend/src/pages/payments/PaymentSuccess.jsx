import React, { useEffect } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import DashboardLayout from "../../Dashboard/DashboardLayout";
import { clearPaymentState } from "../../slices/paymentSlice";
import { playNotificationSound } from "../../utils/playSound";
import confetti from "canvas-confetti";
import "./PaymentSuccess.css";

const PaymentSuccess = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const bookingId = searchParams.get("bookingId");

  useEffect(() => {
    const fromPayment = location.state?.fromPayment;
    const celebratedKey = bookingId ? `celebrated_booking_${bookingId}` : "celebrated_generic_success";
    const hasCelebrated = sessionStorage.getItem(celebratedKey);
    
    if (fromPayment || !hasCelebrated) {
      // Sync success sound and visual confetti immediately on page load
      playNotificationSound("success");
      
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#0d9488", "#10b981", "#059669", "#14b8a6"] // Teal and green accents matching GullyGuide
      });
      
      sessionStorage.setItem(celebratedKey, "true");

      // Clear the navigation state so reloading the page won't trigger confetti again
      if (window.history.replaceState) {
        window.history.replaceState(null, '');
      }
    }
  }, [bookingId, location.state]);

  useEffect(() => {
    return () => {
      dispatch(clearPaymentState());
    };
  }, [dispatch]);

  return (
    <DashboardLayout>
      <div className="payment-result">
        <div className="payment-result-card success">
          <div className="result-icon">✅</div>
          <h1>Payment Successful!</h1>
          <p>Your payment has been confirmed. Your booking is now secured.</p>
          {bookingId && (
            <p className="result-booking-id">Booking ID: #{bookingId}</p>
          )}
          <div className="result-actions">
            <Link to={`/dashboard/bookings/${bookingId}`} className="result-btn primary">
              View Booking
            </Link>
            <Link to="/dashboard" className="result-btn secondary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentSuccess;