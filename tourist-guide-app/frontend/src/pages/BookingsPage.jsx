import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { playNotificationSound } from "../utils/playSound";
import { loadUser } from "../action/authActions";
import DashboardLayout from "../Dashboard/DashboardLayout";
import {
  blockGuideAvailability,
  cancelBooking,
  createReview,
  deleteGuideAvailability,
  deleteReview,
  getGuideAvailability,
  getGuideBookings,
  getMyBookings,
  getMyReviews,
  requestBookingStatusOtp,
  updateBookingStatus,
  updateReview,
  getSavedPosts,
} from "../services/api";
import PostCard from "../Dashboard/myProfiles/PostCard";
import "./BookingsPage.css";

const GUIDE_STATUS_OPTIONS = ["confirmed", "cancelled", "completed"];

const formatDate = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString();
};

const formatDateRange = (booking) => {
  const start = booking.startDate || booking.tourDate;
  const end = booking.endDate || booking.tourDate;
  if (!end || formatDate(start) === formatDate(end)) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);
const addDaysInputValue = (dateValue, days) => {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const canTouristCancel = (status) => status === "pending" || status === "confirmed";

const BookingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading } = useSelector((state) => state.auth);

  const [bookings, setBookings] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [visibleCount, setVisibleCount] = useState(8);
  const [reviewsByBooking, setReviewsByBooking] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [otpStateByBooking, setOtpStateByBooking] = useState({});
  const [submittingId, setSubmittingId] = useState("");
  const [availability, setAvailability] = useState({ blockedRanges: [], bookings: [] });
  const [availabilityForm, setAvailabilityForm] = useState({
    startDate: todayInputValue(),
    endDate: todayInputValue(),
    reason: "",
  });
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState("");
  const [selectedCancelReason, setSelectedCancelReason] = useState("");
  const [otherCancelReasonDetails, setOtherCancelReasonDetails] = useState("");

  useEffect(() => {
    setVisibleCount(8);
  }, [activeTab]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!user && !loading) {
      dispatch(loadUser());
    }
  }, [token, user, loading, dispatch, navigate]);

  const role = (user?.role || "").toLowerCase();
  const isGuide = role === "guide";
  const isAdmin = role === "admin";
  const isGuideLike = isGuide || isAdmin;
  const isTourist = role === "tourist";

  const loadDashboard = async () => {
    if (!token || !role) return;

    setPageLoading(true);
    setError("");
    setMessage("");

    try {
      if (isGuideLike) {
        const response = await getGuideBookings();
        setBookings(Array.isArray(response?.bookings) ? response.bookings : []);
        setReviewsByBooking({});
      } else if (isTourist) {
        const [bookingResponse, reviewResponse, savedPostsResponse] = await Promise.all([
          getMyBookings(),
          getMyReviews(),
          getSavedPosts(),
        ]);

        const nextBookings = Array.isArray(bookingResponse?.bookings) ? bookingResponse.bookings : [];
        const myReviews = Array.isArray(reviewResponse?.reviews) ? reviewResponse.reviews : [];
        const nextSaved = Array.isArray(savedPostsResponse?.savedPosts) ? savedPostsResponse.savedPosts : [];
        const reviewMap = myReviews.reduce((acc, review) => {
          const bookingId = review?.booking;
          if (bookingId) {
            acc[bookingId] = review;
          }
          return acc;
        }, {});

        setBookings(nextBookings);
        setReviewsByBooking(reviewMap);
        setSavedPosts(nextSaved);
      } else {
        setBookings([]);
      }
    } catch (requestError) {
      setError(requestError?.message || "Unable to load bookings.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role && token) {
      loadDashboard();
    }
  }, [user?.role, token]);

  useEffect(() => {
    if (!isTourist || !bookings.length) return;

    setReviewDrafts((current) => {
      const next = { ...current };

      bookings.forEach((booking) => {
        const existing = reviewsByBooking[booking._id];
        if (!next[booking._id]) {
          next[booking._id] = {
            rating: existing?.rating || 5,
            comment: existing?.comment || "",
          };
        }
      });

      return next;
    });
  }, [bookings, reviewsByBooking, isTourist]);

  const guideReviewSummary = useMemo(() => {
    if (!isGuideLike || !user) return null;
    return {
      averageRating: user.averageRating || 0,
      totalReviews: user.totalReviews || 0,
    };
  }, [isGuideLike, user]);

  const loadAvailability = async () => {
    if (!isGuideLike || !user?._id) return;

    const from = todayInputValue();
    const to = addDaysInputValue(from, 90);
    const response = await getGuideAvailability(user._id, { from, to });
    setAvailability(response?.availability || { blockedRanges: [], bookings: [] });
  };

  useEffect(() => {
    if (isGuideLike && user?._id) {
      loadAvailability().catch((requestError) => {
        setError(requestError?.message || "Unable to load guide availability.");
      });
    }
  }, [isGuideLike, user?._id]);

  const handleAvailabilityChange = (event) => {
    const { name, value } = event.target;
    setAvailabilityForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "startDate" && current.endDate < value ? { endDate: value } : {}),
    }));
  };

  const handleBlockDates = async (event) => {
    event.preventDefault();

    if (new Date(availabilityForm.endDate) < new Date(availabilityForm.startDate)) {
      setError("End date cannot be before start date.");
      setMessage("");
      return;
    }

    setSubmittingId("availability:block");
    setError("");
    setMessage("");

    try {
      const response = await blockGuideAvailability(availabilityForm);
      setMessage(response?.message || "Dates blocked successfully.");
      setAvailabilityForm({
        startDate: todayInputValue(),
        endDate: todayInputValue(),
        reason: "",
      });
      await loadAvailability();
    } catch (requestError) {
      setError(requestError?.message || "Unable to block dates.");
    } finally {
      setSubmittingId("");
    }
  };

  const handleDeleteAvailability = async (availabilityId) => {
    setSubmittingId(`availability:${availabilityId}`);
    setError("");
    setMessage("");

    try {
      const response = await deleteGuideAvailability(availabilityId);
      setMessage(response?.message || "Blocked dates removed.");
      await loadAvailability();
    } catch (requestError) {
      setError(requestError?.message || "Unable to remove blocked dates.");
    } finally {
      setSubmittingId("");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    setSubmittingId(bookingId);
    setError("");
    setMessage("");

    try {
      const response = await cancelBooking(bookingId);
      const msg = response?.message || "Booking cancelled successfully.";
      setMessage(msg);
      toast.error("Booking cancelled");
      playNotificationSound("error");
      window.dispatchEvent(new CustomEvent("notification:sync"));
      await loadDashboard();
    } catch (requestError) {
      const errMsg = requestError?.message || "Unable to cancel booking.";
      setError(errMsg);
      toast.error(errMsg);
      playNotificationSound("error");
    } finally {
      setSubmittingId("");
    }
  };

  const handleGuideStatus = async (bookingId, status) => {
    setSubmittingId(`${bookingId}:${status}`);
    setError("");
    setMessage("");

    try {
      let otpVal = undefined;
      if (status === "confirmed") {
        const otpState = otpStateByBooking[bookingId];
        if (otpState && otpState.isOtpRequested) {
          otpVal = otpState.otpValue;
        }
      }
      const response = await updateBookingStatus(bookingId, status, otpVal);
      const msg = response?.message || `Booking marked as ${status}.`;
      setMessage(msg);

      if (status === "confirmed" || status === "completed") {
        toast.success(msg);
        playNotificationSound("success");
      } else if (status === "cancelled") {
        toast.error(msg);
        playNotificationSound("error");
      } else {
        toast(msg);
      }

      window.dispatchEvent(new CustomEvent("notification:sync"));
      await loadDashboard();
      await loadAvailability();
    } catch (requestError) {
      const errMsg = requestError?.message || "Unable to update booking.";
      setError(errMsg);
      toast.error(errMsg);
      playNotificationSound("error");
    } finally {
      setSubmittingId("");
    }
  };

  const handleConfirmGuideCancellation = async () => {
    if (!selectedCancelReason) return;
    
    let finalReason = selectedCancelReason;
    if (selectedCancelReason === "Other") {
      finalReason = `Other: ${otherCancelReasonDetails.trim()}`;
    }

    setShowCancelConfirmModal(false);
    setSubmittingId(`${cancellingBookingId}:cancelled`);
    setError("");
    setMessage("");

    try {
      const response = await updateBookingStatus(cancellingBookingId, "cancelled", undefined, finalReason);
      const msg = response?.message || `Booking marked as cancelled.`;
      setMessage(msg);
      toast.error(msg);
      playNotificationSound("error");

      window.dispatchEvent(new CustomEvent("notification:sync"));
      await loadDashboard();
      await loadAvailability();
    } catch (requestError) {
      const errMsg = requestError?.message || "Unable to cancel booking.";
      setError(errMsg);
      toast.error(errMsg);
      playNotificationSound("error");
    } finally {
      setSubmittingId("");
      setCancellingBookingId("");
      setSelectedCancelReason("");
      setOtherCancelReasonDetails("");
    }
  };

  const handleDraftChange = (bookingId, field, value) => {
    setReviewDrafts((current) => ({
      ...current,
      [bookingId]: {
        ...(current[bookingId] || { rating: 5, comment: "" }),
        [field]: value,
      },
    }));
  };

  const handleSaveReview = async (bookingId) => {
    const draft = reviewDrafts[bookingId];
    const existingReview = reviewsByBooking[bookingId];

    setSubmittingId(`review:${bookingId}`);
    setError("");
    setMessage("");

    try {
      const response = existingReview?._id
        ? await updateReview(existingReview._id, {
            rating: Number(draft?.rating || 5),
            comment: draft?.comment || "",
          })
        : await createReview({
            bookingId,
            rating: Number(draft?.rating || 5),
            comment: draft?.comment || "",
          });

      setMessage(response?.message || "Review saved successfully.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError?.message || "Unable to save review.");
    } finally {
      setSubmittingId("");
    }
  };

  const handleDeleteReview = async (bookingId) => {
    const existingReview = reviewsByBooking[bookingId];
    if (!existingReview?._id) return;

    setSubmittingId(`delete-review:${bookingId}`);
    setError("");
    setMessage("");

    try {
      const response = await deleteReview(existingReview._id);
      setMessage(response?.message || "Review deleted successfully.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError?.message || "Unable to delete review.");
    } finally {
      setSubmittingId("");
    }
  };

  const handleRequestOtp = async (bookingId) => {
    setSubmittingId(`${bookingId}:request-otp`);
    setError("");
    setMessage("");
    try {
      await requestBookingStatusOtp(bookingId, "confirmed");
      setOtpStateByBooking((current) => ({
        ...current,
        [bookingId]: {
          isOtpRequested: true,
          otpValue: "",
        },
      }));
      setMessage("Confirmation OTP sent to tourist email.");
    } catch (requestError) {
      setError(requestError?.message || "Unable to send OTP.");
    } finally {
      setSubmittingId("");
    }
  };

  const handleOtpChange = (bookingId, value) => {
    setOtpStateByBooking((current) => ({
      ...current,
      [bookingId]: {
        ...(current[bookingId] || { isOtpRequested: true, otpValue: "" }),
        otpValue: value,
      },
    }));
  };

  // Sort bookings within each tab by most recent date first
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const dateA = new Date(a.startDate || a.tourDate || 0);
      const dateB = new Date(b.startDate || b.tourDate || 0);
      return dateB - dateA;
    });
  }, [bookings]);

  // Filter bookings based on activeTab
  const filteredBookings = useMemo(() => {
    return sortedBookings.filter((booking) => {
      if (activeTab === "All") return true;
      if (activeTab === "Upcoming/Pending") {
        return booking.status === "pending" || booking.status === "confirmed";
      }
      if (activeTab === "Completed") {
        return booking.status === "completed";
      }
      if (activeTab === "Cancelled") {
        return booking.status === "cancelled";
      }
      return true;
    });
  }, [sortedBookings, activeTab]);

  // Page or "Load more" slicing
  const displayedBookings = useMemo(() => {
    return filteredBookings.slice(0, visibleCount);
  }, [filteredBookings, visibleCount]);

  // Get Booking Location with fallback
  const getBookingLocation = (booking) => {
    let loc = booking?.post?.location;
    let city = "";
    let state = "";
    
    if (loc && typeof loc === "object") {
      city = loc.city;
      state = loc.state;
    } else if (loc && typeof loc === "string") {
      city = loc;
    }
    
    const lowerCity = String(city || "").toLowerCase().trim();
    const placeholders = ["testing", "location pending", "pending", "test", "na", "n/a", "none", "placeholder"];
    
    const isPlaceholder = !city || placeholders.includes(lowerCity) || lowerCity === "";
    
    if (isPlaceholder) {
      const guideLoc = booking?.guide?.location;
      if (guideLoc && typeof guideLoc === "object") {
        city = guideLoc.city || "";
        state = guideLoc.state || "";
      } else if (guideLoc && typeof guideLoc === "string") {
        city = guideLoc;
      }
    }

    const cityStr = String(city || "").trim();
    const stateStr = String(state || "").trim();
    
    if (cityStr && stateStr) {
      if (cityStr.toLowerCase().includes(stateStr.toLowerCase())) {
        return cityStr;
      }
      return `${cityStr}, ${stateStr}`;
    }
    
    return cityStr || stateStr || "Location pending";
  };

  if (token && loading && !user) {
    return (
      <DashboardLayout>
        <div className="bookings-page">
          <p className="muted">Loading your dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bookings-page">
        <div className="bookings-hero">
          <div>
            <p className="bookings-eyebrow">{isGuideLike ? "Guide Bookings" : "My Bookings"}</p>
            <h1>{isGuideLike ? "Manage incoming booking requests" : "Track your trips and reviews"}</h1>
            <p>
              {isGuideLike
                ? "Confirm, complete, or decline tour requests sent to your guide posts."
                : "Check your booking statuses, cancel upcoming trips, and review completed tours."}
            </p>
          </div>

          {guideReviewSummary ? (
            <div className="bookings-summary-card">
              <span>Public rating</span>
              <strong>{guideReviewSummary.averageRating || 0}/5</strong>
              <small>{guideReviewSummary.totalReviews || 0} reviews</small>
            </div>
          ) : null}
        </div>

        {message ? <div className="bookings-banner is-success">{message}</div> : null}
        {error ? <div className="bookings-banner is-error">{error}</div> : null}

        {isGuideLike ? (
          <section className="availability-manager">
            <div className="availability-manager__header">
              <div>
                <h2>Availability calendar</h2>
                <p>Block days you cannot guide. Pending and confirmed bookings are held automatically.</p>
              </div>
              <span>{availability.blockedRanges?.length || 0} blocked ranges</span>
            </div>

            <form className="availability-form" onSubmit={handleBlockDates}>
              <label>
                Start
                <input
                  type="date"
                  min={todayInputValue()}
                  name="startDate"
                  value={availabilityForm.startDate}
                  onChange={handleAvailabilityChange}
                  required
                />
              </label>
              <label>
                End
                <input
                  type="date"
                  min={availabilityForm.startDate || todayInputValue()}
                  name="endDate"
                  value={availabilityForm.endDate}
                  onChange={handleAvailabilityChange}
                  required
                />
              </label>
              <label>
                Reason
                <input
                  name="reason"
                  maxLength="200"
                  value={availabilityForm.reason}
                  onChange={handleAvailabilityChange}
                  placeholder="Personal leave, already traveling..."
                />
              </label>
              <button type="submit" className="primary-btn" disabled={submittingId === "availability:block"}>
                {submittingId === "availability:block" ? "Blocking..." : "Block dates"}
              </button>
            </form>

            <div className="availability-lists">
              <div>
                <h3>Blocked by you</h3>
                {availability.blockedRanges?.length ? (
                  availability.blockedRanges.map((range) => (
                    <div key={range._id} className="availability-row">
                      <span>{formatDate(range.startDate)} - {formatDate(range.endDate)}</span>
                      <small>{range.reason || "Unavailable"}</small>
                      <button
                        type="button"
                        className="ghost-btn"
                        disabled={submittingId === `availability:${range._id}`}
                        onClick={() => handleDeleteAvailability(range._id)}
                      >
                        {submittingId === `availability:${range._id}` ? "Removing..." : "Unblock"}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="muted">No manually blocked dates.</p>
                )}
              </div>

              <div>
                <h3>Held by bookings</h3>
                {availability.bookings?.length ? (
                  availability.bookings.map((booking) => (
                    <div key={booking._id} className="availability-row is-booking">
                      <span>{formatDateRange(booking)}</span>
                      <small>{booking?.post?.title || booking.status}</small>
                    </div>
                  ))
                ) : (
                  <p className="muted">No pending or confirmed booking holds.</p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {pageLoading ? <p className="muted">Loading bookings...</p> : null}

        {!pageLoading ? (
          <div className="p-tabs-header" style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              className={`p-tab-btn ${activeTab === "All" ? "active" : ""}`}
              onClick={() => setActiveTab("All")}
            >
              All ({bookings.length})
            </button>
            <button
              type="button"
              className={`p-tab-btn ${activeTab === "Upcoming/Pending" ? "active" : ""}`}
              onClick={() => setActiveTab("Upcoming/Pending")}
            >
              Upcoming/Pending ({
                bookings.filter(b => b.status === "pending" || b.status === "confirmed").length
              })
            </button>
            <button
              type="button"
              className={`p-tab-btn ${activeTab === "Completed" ? "active" : ""}`}
              onClick={() => setActiveTab("Completed")}
            >
              Completed ({
                bookings.filter(b => b.status === "completed").length
              })
            </button>
            <button
              type="button"
              className={`p-tab-btn ${activeTab === "Cancelled" ? "active" : ""}`}
              onClick={() => setActiveTab("Cancelled")}
            >
              Cancelled ({
                bookings.filter(b => b.status === "cancelled").length
              })
            </button>
            {isTourist && (
              <button
                type="button"
                className={`p-tab-btn ${activeTab === "Saved Itinerary" ? "active" : ""}`}
                onClick={() => setActiveTab("Saved Itinerary")}
              >
                My Saved Itinerary ({savedPosts.length})
              </button>
            )}
          </div>
        ) : null}

        {activeTab !== "Saved Itinerary" && !pageLoading && !filteredBookings.length ? (
          <div className="bookings-empty">
            <h3>No bookings found</h3>
            <p>
              {activeTab === "All"
                ? (isGuideLike ? "Once tourists book one of your guide posts, those requests will show up here." : "Explore guide profiles and book a trip to start seeing bookings here.")
                : `You do not have any bookings in the "${activeTab}" status.`}
            </p>
            {activeTab === "All" && !isGuideLike ? (
              <Link to="/dashboard" className="primary-btn">
                Explore Guides
              </Link>
            ) : null}
          </div>
        ) : null}

        {activeTab !== "Saved Itinerary" && !pageLoading && filteredBookings.length ? (
          <>
            <div className="bookings-grid">
              {displayedBookings.map((booking) => {
                const review = reviewsByBooking[booking._id];
                const draft = reviewDrafts[booking._id] || { rating: 5, comment: "" };
                const otpState = otpStateByBooking[booking._id] || {
                  isOtpRequested: false,
                  otpValue: "",
                };

                return (
                  <article key={booking._id} className={`booking-card ${booking.status === "cancelled" ? "is-cancelled" : ""}`}>
                    <div className="booking-card__header">
                      <div>
                        <h3>{booking?.post?.title || "Tour booking"}</h3>
                        <p className="muted">
                          {isGuideLike
                            ? `Tourist: ${booking?.tourist?.name || "Unknown"}`
                            : `Guide: ${booking?.guide?.name || "Unknown"}`}
                        </p>
                      </div>
                      <span className={`booking-status status-${booking.status}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="booking-card__meta">
                      <span>{formatDateRange(booking)}</span>
                      <span>{booking.durationDays || 1} day{(booking.durationDays || 1) === 1 ? "" : "s"}</span>
                      <span>{booking.numberOfPeople} people</span>
                      <span>Rs. {booking.totalPrice ?? 0}</span>
                      <span>{getBookingLocation(booking)}</span>
                    </div>

                    {booking.specialRequests ? (
                      <p className="booking-note">
                        <strong>Special request:</strong> {booking.specialRequests}
                      </p>
                    ) : null}

                    {booking.status === "cancelled" && booking.cancellationReason ? (
                      <p className="booking-note" style={{ color: "#be123c", backgroundColor: "#fff1f2", border: "1px solid rgba(225,29,72,0.2)" }}>
                        <strong>Cancellation Reason:</strong> {booking.cancellationReason}
                      </p>
                    ) : null}

                    {booking.refundStatus && booking.refundStatus !== "not_applicable" ? (
                      <p className="booking-note" style={{ color: "#312e81", backgroundColor: "#e0e7ff", border: "1px solid rgba(79,70,229,0.2)" }}>
                        <strong>Refund Status:</strong> {
                          booking.refundStatus === "pending" ? "Refund Initiated" :
                          booking.refundStatus === "processing" ? "Processing — usually takes 5-7 business days" :
                          booking.refundStatus === "completed" ? "Refund Completed" :
                          booking.refundStatus === "failed" ? "Refund Failed" :
                          booking.refundStatus
                        } {booking.refundAmount ? `(₹${booking.refundAmount})` : ""}
                      </p>
                    ) : null}

                    {isGuideLike ? (
                      <div className="booking-actions">
                        {booking.status === "pending" ? (
                          <button
                            type="button"
                            className="ghost-btn"
                            disabled={submittingId === `${booking._id}:request-otp`}
                            onClick={() => handleRequestOtp(booking._id)}
                          >
                            {submittingId === `${booking._id}:request-otp` ? "Sending..." : "Request OTP"}
                          </button>
                        ) : null}

                        {booking.status === "pending" ? (
                          <button
                            type="button"
                            className="ghost-btn"
                            disabled={submittingId === `${booking._id}:confirmed`}
                            onClick={() => handleGuideStatus(booking._id, "confirmed")}
                          >
                            {submittingId === `${booking._id}:confirmed` ? "Saving..." : "Confirm"}
                          </button>
                        ) : null}

                        {GUIDE_STATUS_OPTIONS.filter((status) => status !== "confirmed").map((status) => {
                          const isCompleted = status === "completed";
                          const isPaymentPending = booking.paymentStatus !== "fully_paid";
                          const isDisabled = booking.status === status || 
                                             submittingId === `${booking._id}:${status}` ||
                                             (isCompleted && isPaymentPending);

                          return (
                            <button
                              key={status}
                              type="button"
                              className="ghost-btn"
                              disabled={isDisabled}
                              onClick={() => {
                                if (status === "cancelled") {
                                  setCancellingBookingId(booking._id);
                                  setSelectedCancelReason("");
                                  setOtherCancelReasonDetails("");
                                  setShowCancelConfirmModal(true);
                                } else {
                                  handleGuideStatus(booking._id, status);
                                }
                              }}
                              title={isCompleted && isPaymentPending ? "Cannot mark as completed: final payment is still pending." : undefined}
                            >
                              {submittingId === `${booking._id}:${status}` ? "Saving..." : `Mark ${status}`}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {isGuideLike && booking.status === "pending" && otpState.isOtpRequested ? (
                      <div className="booking-note">
                        <label>
                          <strong>Enter 4-digit OTP:</strong>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength="4"
                            value={otpState.otpValue}
                            onChange={(event) => handleOtpChange(booking._id, event.target.value)}
                            placeholder="1234"
                            style={{ marginLeft: "10px", maxWidth: "120px" }}
                          />
                        </label>
                      </div>
                    ) : null}

                    {isTourist && canTouristCancel(booking.status) ? (
                      <div className="booking-actions">
                        <button
                          type="button"
                          className="ghost-btn"
                          disabled={submittingId === booking._id}
                          onClick={() => handleCancelBooking(booking._id)}
                        >
                          {submittingId === booking._id ? "Cancelling..." : "Cancel booking"}
                        </button>
                        {(booking.status === "pending" || booking.status === "confirmed") &&
                         booking.paymentStatus !== "fully_paid" &&
                         booking.paymentStatus !== "deposit_paid" ? (
                          <button
                            type="button"
                            className="primary-btn"
                            onClick={() => navigate(`/dashboard/payment?bookingId=${booking._id}`)}
                          >
                            Pay Now
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {isTourist && booking.status === "completed" ? (
                      <div className="review-box">
                        <div className="review-box__title">
                          <h4>{review ? "Update your review" : "Review this trip"}</h4>
                          {review?.createdAt ? (
                            <small>Saved on {new Date(review.createdAt).toLocaleDateString()}</small>
                          ) : null}
                        </div>

                        <div className="review-form-grid">
                          <label>
                            Rating
                            <select
                              value={draft.rating}
                              onChange={(event) =>
                                handleDraftChange(booking._id, "rating", event.target.value)
                              }
                            >
                              <option value="5">5</option>
                              <option value="4">4</option>
                              <option value="3">3</option>
                              <option value="2">2</option>
                              <option value="1">1</option>
                            </select>
                          </label>

                          <label className="review-form-grid__full">
                            Comment
                            <textarea
                              rows="4"
                              maxLength="500"
                              value={draft.comment}
                              onChange={(event) =>
                                handleDraftChange(booking._id, "comment", event.target.value)
                              }
                              placeholder="Share how the tour went..."
                            />
                          </label>
                        </div>

                        <div className="booking-actions">
                          <button
                            type="button"
                            className="primary-btn"
                            disabled={submittingId === `review:${booking._id}`}
                            onClick={() => handleSaveReview(booking._id)}
                          >
                            {submittingId === `review:${booking._id}`
                              ? "Saving..."
                              : review
                              ? "Update review"
                              : "Submit review"}
                          </button>

                          {review?._id ? (
                            <button
                              type="button"
                              className="ghost-btn"
                              disabled={submittingId === `delete-review:${booking._id}`}
                              onClick={() => handleDeleteReview(booking._id)}
                            >
                              {submittingId === `delete-review:${booking._id}` ? "Deleting..." : "Delete review"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
            {filteredBookings.length > visibleCount ? (
              <div className="load-more-container">
                <button
                  type="button"
                  className="load-more-btn"
                  onClick={() => setVisibleCount((prev) => prev + 8)}
                >
                  Load More
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {activeTab === "Saved Itinerary" && isTourist && (
          <div className="saved-posts-section">
            {!savedPosts.length ? (
              <div className="bookings-empty">
                <h3>No saved posts found</h3>
                <p>Bookmark posts from the home feed to build your saved itinerary.</p>
                <Link to="/dashboard" className="primary-btn" style={{ textDecoration: "none", color: "#fff", background: "#3b82f6", padding: "10px 20px", borderRadius: "10px", fontWeight: "700" }}>
                  Explore Posts
                </Link>
              </div>
            ) : (
              <div className="postsGrid" style={{ marginTop: "1rem" }}>
                {savedPosts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    refreshPosts={loadDashboard}
                    currentUser={user}
                    onUnsave={(postId) => {
                      setSavedPosts(curr => curr.filter(p => p._id !== postId));
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* GUIDE CANCELLATION CONFIRMATION MODAL */}
      {showCancelConfirmModal && (
        <div className="p-modal-backdrop" onClick={() => setShowCancelConfirmModal(false)}>
          <div className="p-confirm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <h2>Cancel this booking?</h2>
            <p>Please select the reason for cancelling this booking. This reason will be shared with the tourist.</p>
            
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.9rem", color: "#334155" }}>
                Cancellation Reason <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={selectedCancelReason}
                onChange={(e) => setSelectedCancelReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.95rem",
                  color: "#0f172a",
                  outline: "none"
                }}
              >
                <option value="">-- Select a reason --</option>
                <option value="Guide unavailable">Guide unavailable</option>
                <option value="Weather/safety concern">Weather/safety concern</option>
                <option value="Tourist requested change">Tourist requested change</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {selectedCancelReason === "Other" && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.9rem", color: "#334155" }}>
                  Please specify details <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows="3"
                  maxLength="200"
                  value={otherCancelReasonDetails}
                  onChange={(e) => setOtherCancelReasonDetails(e.target.value)}
                  placeholder="Provide details about the cancellation..."
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    color: "#0f172a",
                    outline: "none",
                    resize: "none"
                  }}
                />
              </div>
            )}

            <div className="p-modal-buttons" style={{ marginTop: "1.5rem" }}>
              <button 
                type="button"
                className="btn-modal-cancel" 
                onClick={() => setShowCancelConfirmModal(false)}
              >
                Go Back
              </button>
              <button 
                type="button"
                className="btn-modal-confirm" 
                style={{
                  backgroundColor: "#ef4444",
                  opacity: (!selectedCancelReason || (selectedCancelReason === "Other" && !otherCancelReasonDetails.trim())) ? 0.5 : 1,
                  cursor: (!selectedCancelReason || (selectedCancelReason === "Other" && !otherCancelReasonDetails.trim())) ? "not-allowed" : "pointer"
                }}
                disabled={!selectedCancelReason || (selectedCancelReason === "Other" && !otherCancelReasonDetails.trim())}
                onClick={handleConfirmGuideCancellation}
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default BookingsPage;
