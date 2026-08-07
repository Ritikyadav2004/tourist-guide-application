import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import DashboardLayout from "../../Dashboard/DashboardLayout";
import { clearPaymentState } from "../../action/paymentActions";
import "./PaymentSuccess.css";

const PaymentSuccess = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

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