import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import DashboardLayout from "../../Dashboard/DashboardLayout";
import { clearPaymentState } from "../../action/paymentActions";
import "./PaymentFailure.css";

const PaymentFailure = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const error = searchParams.get("error");

  useEffect(() => {
    return () => {
      dispatch(clearPaymentState());
    };
  }, [dispatch]);

  return (
    <DashboardLayout>
      <div className="payment-result">
        <div className="payment-result-card failure">
          <div className="result-icon">❌</div>
          <h1>Payment Failed</h1>
          <p>{error || "Something went wrong with your payment. Please try again."}</p>
          {bookingId && (
            <p className="result-booking-id">Booking ID: #{bookingId}</p>
          )}
          <div className="result-actions">
            <Link to={`/payment?bookingId=${bookingId}`} className="result-btn primary">
              Try Again
            </Link>
            <Link to={`/dashboard/bookings/${bookingId}`} className="result-btn secondary">
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

export default PaymentFailure;