import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Razorpay from "react-razorpay";
import DashboardLayout from "../../Dashboard/DashboardLayout";
import {
  createOrderAction,
  verifyPaymentAction,
  clearPaymentState,
  clearPaymentError,
} from "../../action/paymentActions";
import { getBookingDetails } from "../../services/api";
import "./PaymentPage.css";

const PaymentPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [bookingError, setBookingError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("deposit"); // deposit or final

  const { user, token } = useSelector((state) => state.auth);
  const { loading, order, error, success } = useSelector((state) => state.payment);

  // Load booking details
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!bookingId) {
      setBookingError("No booking selected.");
      setLoadingBooking(false);
      return;
    }

    const loadBooking = async () => {
      try {
        const data = await getBookingDetails(bookingId);
        setBooking(data.booking);
        // Determine if deposit or final payment
        if (data.booking?.paymentStatus === "deposit_pending") {
          setPaymentMethod("deposit");
        } else if (data.booking?.paymentStatus === "final_pending") {
          setPaymentMethod("final");
        }
      } catch (err) {
        setBookingError(err?.message || "Unable to load booking.");
      } finally {
        setLoadingBooking(false);
      }
    };

    loadBooking();

    return () => {
      dispatch(clearPaymentState());
      dispatch(clearPaymentError());
    };
  }, [dispatch, token, navigate, bookingId]);

  // Handle Razorpay payment
  const handlePayment = async () => {
    const paymentType = paymentMethod === "final" ? "final" : "deposit";

    console.log("[PaymentPage:handlePayment] starting payment", {
      bookingId,
      paymentType,
      booking,
    });

    if (!bookingId || !booking?._id) {
      console.error("[PaymentPage:handlePayment] invalid bookingId", {
        bookingId,
        booking,
      });
      alert("Invalid booking selected.");
      return;
    }

    try {
      // Step 1: Create Razorpay Order
      const orderData = await dispatch(createOrderAction(bookingId, paymentType));
      console.log("[PaymentPage:handlePayment] order created", {
        bookingId,
        paymentType,
        orderData,
      });

      const orderId = orderData?.order?.id || orderData?.orderId;
      const orderAmount = orderData?.order?.amount || orderData?.amount;
      const orderCurrency = orderData?.order?.currency || orderData?.currency || "INR";

      if (!orderId) {
        throw new Error("Failed to create payment order.");
      }

      // Step 2: Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_xxxxxxxx",
        amount: orderAmount,
        currency: orderCurrency,
        name: "GullyGuide",
        description: `${paymentType === "deposit" ? "Deposit" : "Final"} Payment for Booking #${bookingId}`,
        order_id: orderId,
        handler: async (response) => {
          // Step 3: Verify Payment
          try {
            await dispatch(
              verifyPaymentAction({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                bookingId: bookingId,
              })
            );
            // Redirect to success
            navigate(`/payment/success?bookingId=${bookingId}`);
          } catch (verifyError) {
            // Redirect to failure
            navigate(`/payment/failure?bookingId=${bookingId}&error=${verifyError.message}`);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        notes: {
          bookingId: bookingId,
          paymentType,
        },
        theme: {
          color: "#22c55e",
        },
        modal: {
          ondismiss: () => {
            navigate(`/payment/failure?bookingId=${bookingId}&error=Payment cancelled by user`);
          },
        },
      };

      const razorpay = new Razorpay(options);
      razorpay.open();
    } catch (err) {
      navigate(`/payment/failure?bookingId=${bookingId}&error=${err.message}`);
    }
  };

  // Loading state
  if (loadingBooking) {
    return (
      <DashboardLayout>
        <div className="payment-page">
          <div className="payment-loading">Loading booking details...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (bookingError || !booking) {
    return (
      <DashboardLayout>
        <div className="payment-page">
          <div className="payment-error-card">
            <h2>❌ Unable to load booking</h2>
            <p>{bookingError || "Booking not found."}</p>
            <Link to="/dashboard/bookings" className="payment-btn-primary">
              Back to Bookings
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Amount to pay
  const depositAmount = booking.depositAmount || Math.round(booking.totalPrice * 0.2);
  const finalAmount = booking.finalAmount || Math.max((booking.totalPrice || 0) - depositAmount, 0);
  const currentAmount = paymentMethod === "deposit" ? depositAmount : finalAmount;

  // Check if payment is already completed
  if (booking.paymentStatus === "fully_paid") {
    return (
      <DashboardLayout>
        <div className="payment-page">
          <div className="payment-success-card">
            <h2>✅ Booking Already Paid</h2>
            <p>This booking has been fully paid.</p>
            <Link to={`/dashboard/bookings/${bookingId}`} className="payment-btn-primary">
              View Booking
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="payment-page">
        <div className="payment-container">
          <div className="payment-header">
            <h1>💳 Complete Your Payment</h1>
            <p>Secure your booking with a deposit or pay in full.</p>
          </div>

          {error && <div className="payment-error">{error}</div>}

          {/* Booking Summary */}
          <div className="payment-summary">
            <h3>Booking Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span>Tourist</span>
                <strong>{user?.name}</strong>
              </div>
              <div className="summary-item">
                <span>Guide</span>
                <strong>{booking.guide?.name || "Guide"}</strong>
              </div>
              <div className="summary-item">
                <span>Dates</span>
                <strong>
                  {new Date(booking.startDate).toLocaleDateString()} -{" "}
                  {new Date(booking.endDate).toLocaleDateString()}
                </strong>
              </div>
              <div className="summary-item">
                <span>People</span>
                <strong>{booking.numberOfPeople}</strong>
              </div>
              <div className="summary-item">
                <span>Total Price</span>
                <strong>₹{booking.totalPrice}</strong>
              </div>
              <div className="summary-item">
                <span>Status</span>
                <strong className={`status-${booking.paymentStatus}`}>
                  {booking.paymentStatus?.replace("_", " ") || "Pending"}
                </strong>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="payment-options">
            <h3>Choose Payment Method</h3>
            <div className="option-group">
              <label className={`option-card ${paymentMethod === "deposit" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="deposit"
                  checked={paymentMethod === "deposit"}
                  onChange={() => setPaymentMethod("deposit")}
                />
                <div className="option-content">
                  <span className="option-title">Deposit (20%)</span>
                  <span className="option-amount">₹{depositAmount}</span>
                  <span className="option-desc">Secure your booking now</span>
                </div>
              </label>

              <label className={`option-card ${paymentMethod === "final" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="final"
                  checked={paymentMethod === "final"}
                  onChange={() => setPaymentMethod("final")}
                />
                <div className="option-content">
                  <span className="option-title">Pay in Full</span>
                  <span className="option-amount">₹{finalAmount}</span>
                  <span className="option-desc">Complete payment now</span>
                </div>
              </label>
            </div>
          </div>

          {/* Total */}
          <div className="payment-total">
            <span>You will pay</span>
            <strong>₹{currentAmount}</strong>
          </div>

          {/* Pay Button */}
          <button
            className="payment-btn-pay"
            onClick={handlePayment}
            disabled={loading || !currentAmount}
          >
            {loading ? "Processing..." : `Pay ₹${currentAmount} with Razorpay`}
          </button>

          <p className="payment-secure">
            🔒 Secured by Razorpay. Your payment is safe.
          </p>

          <Link to={`/dashboard/bookings/${bookingId}`} className="payment-cancel-link">
            Cancel and go back
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;
