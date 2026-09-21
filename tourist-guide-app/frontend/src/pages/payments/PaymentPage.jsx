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
} from "../../slices/paymentSlice";
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
      navigate("/dashboard/bookings", { replace: true });
      return;
    }

    const loadBooking = async () => {
      try {
        const data = await getBookingDetails(bookingId);
        setBooking(data.booking);
        // Determine if deposit or final payment
        if (data.booking?.paymentStatus === "deposit_pending" || data.booking?.paymentStatus === "pending") {
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
    const isDepositPending = booking?.paymentStatus === "deposit_pending" || booking?.paymentStatus === "pending";
    const paymentType =
      paymentMethod === "final"
        ? (isDepositPending ? "full" : "final")
        : "deposit";

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
      const orderData = await dispatch(createOrderAction({ bookingId, type: paymentType })).unwrap();
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

      // Load Razorpay script dynamically to ensure reliability
      let RazorpayConstructor = window.Razorpay;
      if (!RazorpayConstructor) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = () => {
            RazorpayConstructor = window.Razorpay;
            resolve();
          };
          script.onerror = () => reject(new Error("Failed to load Razorpay SDK. Please check your internet connection."));
          document.body.appendChild(script);
        });
      }

      if (!RazorpayConstructor) {
        throw new Error("Razorpay SDK is not available.");
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
            ).unwrap();
            // Redirect to success
            navigate(`/payment/success?bookingId=${bookingId}`, { state: { fromPayment: true } });
          } catch (verifyError) {
            // Redirect to failure
            navigate(`/payment/failure?bookingId=${bookingId}&error=${verifyError.message || verifyError}`);
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
      };

      const razorpayInstance = new RazorpayConstructor(options);
      razorpayInstance.open();
    } catch (err) {
      navigate(`/payment/failure?bookingId=${bookingId}&error=${err.message || err}`);
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
            <div className="payment-state-icon error" aria-hidden="true">!</div>
            <h2>Unable to load booking</h2>
            <p>{bookingError || "Booking not found."}</p>
            <Link to="/dashboard/bookings" className="payment-btn-primary">
              Back to Bookings
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Cancelled state safeguard
  if (booking.status === "cancelled") {
    return (
      <DashboardLayout>
        <div className="payment-page">
          <div className="payment-error-card" style={{ borderTop: "4px solid #ef4444" }}>
            <div className="payment-state-icon error" style={{ backgroundColor: "#fde8e8", color: "#ef4444" }} aria-hidden="true">!</div>
            <h2>Booking Cancelled</h2>
            <p>This booking has been cancelled and cannot accept further payments.</p>
            <Link to="/dashboard/bookings" className="payment-btn-primary" style={{ backgroundColor: "#ef4444" }}>
              Back to Bookings
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Already paid state safeguard
  if (booking.paymentStatus === "fully_paid") {
    return (
      <DashboardLayout>
        <div className="payment-page">
          <div className="payment-error-card success-card" style={{ borderTop: "4px solid #10b981" }}>
            <div className="payment-state-icon success" style={{ backgroundColor: "#e6f4ea", color: "#10b981", fontSize: "28px" }} aria-hidden="true">✓</div>
            <h2>Booking already paid</h2>
            <p>This booking has already been paid in full. No further action is required.</p>
            <Link to="/dashboard/bookings" className="payment-btn-primary">
              Back to Bookings
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Amount to pay
  const isDepositPending = booking.paymentStatus === "deposit_pending" || booking.paymentStatus === "pending";
  const depositAmount = booking.depositAmount || Math.round(booking.totalPrice * 0.2);
  const finalAmount = booking.finalAmount || Math.round(booking.totalPrice * 0.8);
  const fullAmount = booking.totalPrice;

  const payInFullAmount = isDepositPending ? fullAmount : finalAmount;
  const currentAmount = paymentMethod === "deposit" ? depositAmount : payInFullAmount;

  // Check if payment is already completed
  if (booking.paymentStatus === "fully_paid") {
    return (
      <DashboardLayout>
        <div className="payment-page">
          <div className="payment-success-card">
            <div className="payment-state-icon success" aria-hidden="true">✓</div>
            <h2>Booking Already Paid</h2>
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
            <h1>Complete Your Payment</h1>
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
                <strong>Rs. {booking.totalPrice}</strong>
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
              {isDepositPending && (
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
                    <span className="option-amount">Rs. {depositAmount}</span>
                    <span className="option-desc">Secure your booking now</span>
                  </div>
                </label>
              )}

              <label className={`option-card ${paymentMethod === "final" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="final"
                  checked={paymentMethod === "final"}
                  onChange={() => setPaymentMethod("final")}
                />
                <div className="option-content">
                  <span className="option-title">{isDepositPending ? "Pay in Full" : "Pay Final Balance"}</span>
                  <span className="option-amount">Rs. {payInFullAmount}</span>
                  <span className="option-desc">{isDepositPending ? "Complete payment now" : "Settle remaining balance"}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Total */}
          <div className="payment-total">
            <span>You will pay</span>
            <strong>Rs. {currentAmount}</strong>
          </div>

          {/* Pay Button */}
          <button
            className="payment-btn-pay"
            onClick={handlePayment}
            disabled={loading || !currentAmount}
          >
            {loading ? "Processing..." : `Pay Rs. ${currentAmount} with Razorpay`}
          </button>

          <p className="payment-secure">
            Secured by Razorpay. Your payment is safe.
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
