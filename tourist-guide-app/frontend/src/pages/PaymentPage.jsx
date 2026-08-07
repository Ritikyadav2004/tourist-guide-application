import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../Dashboard/DashboardLayout";
import { createPaymentOrderAction, verifyPaymentAction, getPaymentHistoryAction } from "../action/paymentActions";
import { getBookingDetailsAction } from "../action/bookingActions";
import "./PaymentPage.css";

const PaymentPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useSelector((state) => state.auth);
  const { loading, order, error, success } = useSelector((state) => state.payment);
  const { booking } = useSelector((state) => state.booking);

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const bookingId = searchParams.get("bookingId");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (bookingId) {
      dispatch(getBookingDetailsAction(bookingId));
    }

    loadPaymentHistory();
  }, [token, bookingId]);

  const loadPaymentHistory = async () => {
    try {
      await dispatch(getPaymentHistoryAction());
      const response = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/payments/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPaymentHistory(data.payments || []);
    } catch (err) {
      console.error("Failed to load payment history:", err);
    }
  };

  const handlePayment = async () => {
    if (!bookingId || !booking) {
      alert("Invalid booking");
      return;
    }

    setProcessing(true);
    try {
      // Create Razorpay order
      const orderData = await dispatch(createPaymentOrderAction({
        bookingId,
        amount: booking.totalPrice || booking.amount || 0,
      }));

      if (orderData?.order?.id) {
        // Load Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY_HERE",
            amount: orderData.order.amount,
            currency: orderData.order.currency || "INR",
            name: "GullyGuide",
            description: `Payment for ${booking?.post?.title || "Tour Booking"}`,
            order_id: orderData.order.id,
            handler: async (response) => {
              try {
                await dispatch(verifyPaymentAction({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  bookingId,
                }));
                alert("Payment successful!");
                navigate("/dashboard/bookings");
              } catch (err) {
                alert("Payment verification failed. Please contact support.");
              }
            },
            prefill: {
              name: user?.name || "",
              email: user?.email || "",
              contact: user?.phone || "",
            },
            theme: {
              color: "#3B82F6",
           },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
          rzp.on("payment.failed", (response) => {
            alert(`Payment failed: ${response.error.description}`);
          });
        };
        document.body.appendChild(script);
      }
    } catch (err) {
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="payment-page">
        <div className="payment-header">
          <h1>Payment</h1>
          <button
            className="secondary-btn"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Back to Payment" : "View History"}
          </button>
        </div>

        {error && <div className="payment-error">{error}</div>}
        {success && <div className="payment-success">Payment processed successfully!</div>}

        {showHistory ? (
          <div className="payment-history-section">
            <h2>Payment History</h2>
            {!paymentHistory.length ? (
              <p className="no-history">No payment history found.</p>
            ) : (
              <div className="payment-history-list">
                {paymentHistory.map((payment) => (
                  <div key={payment._id} className="payment-history-card">
                    <div className="payment-history-info">
                      <h3>Order ID: {payment.orderId || "N/A"}</h3>
                      <p>Amount: ₹{payment.amount || 0}</p>
                      <p>Status: <span className={`status-${payment.status?.toLowerCase()}`}>{payment.status || "Unknown"}</span></p>
                      <p>Date: {formatDate(payment.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="payment-content">
            {booking ? (
              <div className="payment-card">
                <div className="payment-details">
                  <h2>Booking Details</h2>
                  <div className="detail-row">
                    <span>Tour:</span>
                    <strong>{booking?.post?.title || "Tour Booking"}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Guide:</span>
                    <strong>{booking?.guide?.name || "N/A"}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Date:</span>
                    <strong>{formatDate(booking.startDate || booking.tourDate)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>People:</span>
                    <strong>{booking.numberOfPeople || 1}</strong>
                  </div>
                  <div className="detail-row total">
                    <span>Total Amount:</span>
                    <strong className="amount">₹{booking.totalPrice || booking.amount || 0}</strong>
                  </div>
                </div>

                <div className="payment-actions">
                  <button
                    className="pay-btn"
                    onClick={handlePayment}
                    disabled={processing || loading || booking.status === "paid"}
                  >
                    {processing ? "Processing..." : loading ? "Loading..." : booking.status === "paid" ? "Already Paid" : "Pay Now"}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => navigate("/dashboard/bookings")}
                  >
                    Cancel
                  </button>
                </div>

                <div className="payment-info">
                  <p>🔒 Secure payment powered by Razorpay</p>
                  <p>💳 All major cards, UPI, and net banking accepted</p>
                </div>
              </div>
            ) : (
              <div className="no-booking">
                <h2>No Booking Selected</h2>
                <p>Please select a booking to make payment.</p>
                <button
                  className="primary-btn"
                  onClick={() => navigate("/dashboard/bookings")}
                >
                  View Bookings
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;
