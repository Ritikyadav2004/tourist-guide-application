import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../Dashboard/Navbar";
import { loadUser } from "../action/authActions";
import {
  getGuideReviews,
  getGuideReviewStats,
  getGuides,
  getPosts,
} from "../services/api";
import "./GuideProfile.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://gullyguide-backend.onrender.com";

const hasGuideImage = (guide) => {
  const src = guide?.avatar || guide?.photo || guide?.image;
  return src && src !== "default-avatar-url" && src !== "default_avatar.jpg" && src !== "/default_profile.jpg";
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAvatarBgColor = (name) => {
  if (!name) return "#0f766e";
  const colors = [
    "#0f766e", // deep brand teal
    "#14b8a6", // bright teal
    "#004d40", // dark pine teal
    "#80cbc4", // soft mint teal
    "#0d9488", // vibrant medium teal
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getGuideSlug = (guide) =>
  encodeURIComponent(guide?._id || guide?.name || "guide");

const normalizeText = (value) => String(value || "").trim().toLowerCase();
const normalizeId = (value) => String(value?._id || value || "").trim();
const todayInputValue = () => new Date().toISOString().slice(0, 10);
const addDaysInputValue = (dateValue, days) => {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const dateInRange = (dateValue, range) => {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  const start = range.startDate || range.tourDate;
  const end = range.endDate || range.tourDate;
  return date >= new Date(start) && date <= new Date(end);
};

const resolveGuideMatch = (guides, guideId, fallbackGuide) => {
  const decodedId = decodeURIComponent(guideId || "");
  const normalizedDecodedId = normalizeText(decodedId);
  const fallbackId = String(fallbackGuide?._id || "");
  const fallbackEmail = normalizeText(fallbackGuide?.email);
  const fallbackName = normalizeText(fallbackGuide?.name);

  return (
    guides.find((g) => getGuideSlug(g) === encodeURIComponent(decodedId)) ||
    guides.find((g) => String(g?._id || "") === decodedId) ||
    guides.find((g) => String(g?.user?._id || g?.userId || "") === decodedId) ||
    guides.find((g) => normalizeText(g?.name) === normalizedDecodedId) ||
    guides.find((g) => fallbackId && String(g?._id || "") === fallbackId) ||
    guides.find((g) => fallbackId && String(g?.user?._id || g?.userId || "") === fallbackId) ||
    guides.find((g) => fallbackEmail && normalizeText(g?.email) === fallbackEmail) ||
    guides.find((g) => fallbackName && normalizeText(g?.name) === fallbackName) ||
    null
  );
};

const GuideProfile = () => {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const fallbackGuide = location.state?.fallbackGuide || null;
  const { user, token, loading: authLoading } = useSelector((state) => state.auth);

  const [guide, setGuide] = useState(null);
  const [guidePosts, setGuidePosts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [similarGuides, setSimilarGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({
    postId: "",
  });

  useEffect(() => {
    if (token && !user && !authLoading) {
      dispatch(loadUser());
    }
  }, [token, user, authLoading, dispatch]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      try {
        const [guidesResponse, postsResponse] = await Promise.all([
          getGuides(),
          getPosts(1, 200),
        ]);

        const list = Array.isArray(guidesResponse?.guides)
          ? guidesResponse.guides
          : Array.isArray(guidesResponse)
          ? guidesResponse
          : [];

        const match = resolveGuideMatch(list, guideId, fallbackGuide);

        const resolvedGuide = match || fallbackGuide || null;

        console.debug("[GuideProfile] Guide resolution", {
          routeGuideId: guideId,
          decodedGuideId: decodeURIComponent(guideId || ""),
          fallbackGuide,
          guidesLoaded: list.length,
          matchedGuide: match,
          resolvedGuide,
          locationState: location.state || null,
        });

        if (!mounted) return;

        setGuide(resolvedGuide);

        const allPosts = Array.isArray(postsResponse?.posts) ? postsResponse.posts : [];
        const resolvedGuideId = normalizeId(resolvedGuide?._id);
        const nextGuidePosts = resolvedGuideId
          ? allPosts.filter((post) => {
              const ownerId = normalizeId(post?.postedBy);
              return ownerId === resolvedGuideId;
            })
          : [];

        setGuidePosts(nextGuidePosts);
        setBookingForm((current) => ({
          ...current,
          postId: nextGuidePosts[0]?._id || "",
        }));

        if (resolvedGuide) {
          const currentCity = resolvedGuide.location?.city?.trim().toLowerCase();
          const currentState = resolvedGuide.location?.state?.trim().toLowerCase();

          let filteredSimilar = list.filter((g) => {
            if (String(g._id) === String(resolvedGuide._id)) return false;
            const gCity = g.location?.city?.trim().toLowerCase();
            const gState = g.location?.state?.trim().toLowerCase();
            
            const cityMatch = currentCity && gCity && gCity === currentCity;
            const stateMatch = currentState && gState && gState === currentState;
            
            return cityMatch || stateMatch;
          });

          if (filteredSimilar.length < 2) {
            filteredSimilar = list
              .filter((g) => String(g._id) !== String(resolvedGuide._id))
              .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
          }

          const similarWithDetails = filteredSimilar.slice(0, 4).map((g) => {
            const gPosts = allPosts.filter(p => String(p.postedBy?._id || p.postedBy) === String(g._id));
            const prices = gPosts.map(p => Number(p.price)).filter(Number.isFinite);
            const minPrice = prices.length ? Math.min(...prices) : (g.price || 0);

            return {
              ...g,
              startingPrice: minPrice
            };
          });

          setSimilarGuides(similarWithDetails);
        } else {
          setSimilarGuides([]);
        }

        if (resolvedGuide?._id) {
          const [reviewsResponse, statsResponse] = await Promise.all([
            getGuideReviews(resolvedGuide._id),
            getGuideReviewStats(resolvedGuide._id),
          ]);

          if (!mounted) return;

          setReviews(Array.isArray(reviewsResponse?.reviews) ? reviewsResponse.reviews : []);
          setReviewStats(statsResponse || null);
        } else {
          setReviews([]);
          setReviewStats(null);
        }
      } catch (err) {
        console.error("Failed to fetch guide profile", err);
        console.debug("[GuideProfile] Falling back after fetch failure", {
          routeGuideId: guideId,
          fallbackGuide,
          locationState: location.state || null,
        });
        if (mounted) {
          setGuide(fallbackGuide || null);
          setGuidePosts([]);
          setReviews([]);
          setReviewStats(null);
        }
      }

      if (mounted) setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [guideId, fallbackGuide, location.state]);

  const role = (user?.role || "").toLowerCase();
  const isTourist = role === "tourist";
  const canMessageGuide = Boolean(token && guide?._id && guide._id !== user?._id);

  const locationText = useMemo(() => {
    if (!guide?.location) return "Location not provided";
    if (typeof guide.location === "string") return guide.location;
    const { city, state, country } = guide.location;
    return [city, state, country].filter(Boolean).join(", ") || "Location not provided";
  }, [guide]);

  const avatarSrc = useMemo(() => {
    const src = guide?.avatar || guide?.photo || guide?.image;
    if (!src || src === "default-avatar-url" || src === "default_avatar.jpg") {
      return "/default_profile.jpg";
    }
    return src.startsWith("http") ? src : `${API_BASE}/uploads/${src}`;
  }, [guide]);

  const selectedPost = useMemo(
    () => guidePosts.find((post) => post._id === bookingForm.postId) || guidePosts[0] || null,
    [guidePosts, bookingForm.postId]
  );

  const selectedPostPrice = useMemo(() => {
    const price = Number(selectedPost?.price);
    return Number.isFinite(price) ? price : null;
  }, [selectedPost]);

  const reviewDistribution = useMemo(() => {
    const distribution = reviewStats?.ratingDistribution || {};
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: distribution[rating] || 0,
    }));
  }, [reviewStats]);

  const handleMessageGuide = () => {
    if (!guide?._id) return;

    if (!token) {
      navigate("/login");
      return;
    }

    navigate("/dashboard/messages", {
      state: {
        prefillGuideId: guide._id,
      },
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="guide-profile page">
          <p className="muted">Loading guide profile...</p>
        </div>
      </>
    );
  }

  if (!guide) {
    return (
      <>
        <Navbar />
        <div className="guide-profile page">
          <p className="muted">We couldn&apos;t find that guide.</p>
          <button className="primary-btn" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="guide-profile page">
        <div className="guide-hero">
          {hasGuideImage(guide) ? (
            <img src={avatarSrc} alt={guide.name} />
          ) : (
            <div
              className="guide-hero-initials"
              style={{ backgroundColor: getAvatarBgColor(guide.name) }}
            >
              {getInitials(guide.name)}
            </div>
          )}
          <div className="guide-meta">
            {guide.isVerified ? (
              <span className="badge-verified">
                <i className="fa-solid fa-circle-check"></i> Verified Guide
              </span>
            ) : (
              <span className="badge-neutral">
                Local Guide
              </span>
            )}
            <h1 style={{ marginTop: "12px" }}>{guide.name}</h1>
            <p className="muted">{locationText}</p>
            <div className="guide-tags">
              {guide.languages?.length ? (
                <span className="pill">Languages: {guide.languages.join(", ")}</span>
              ) : null}
              {guide.experience ? <span className="pill">{guide.experience} yrs experience</span> : null}
              <span className="pill">
                {selectedPostPrice !== null ? `Rs. ${selectedPostPrice} / person` : "Pricing unavailable"}
              </span>
              <span className="pill">
                Rating: {reviewStats?.averageRating || guide.averageRating || 0}/5
              </span>
            </div>
            <div className="trust-badges-row">
              <div className="trust-badge" title="Completed Trips">
                <i className="fa-solid fa-suitcase"></i>
                <span>{guide.completedTrips || 0} Trips Completed</span>
              </div>
              <div className="trust-badge" title="Response Time">
                <i className="fa-solid fa-bolt"></i>
                <span>Usually responds within a day</span>
              </div>
              <div className="trust-badge" title="Registration Date">
                <i className="fa-solid fa-calendar-days"></i>
                <span>{guide.createdAt ? `Member since ${new Date(guide.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}` : "Member since recently"}</span>
              </div>
            </div>
            <div className="cta-row">
              <a className="primary-btn" href={guide.phone ? `tel:${guide.phone}` : `mailto:${guide.email || ""}`}>
                Contact guide
              </a>
              {canMessageGuide ? (
                <button className="primary-btn guide-chat-btn" type="button" onClick={handleMessageGuide}>
                  Message guide
                </button>
              ) : null}
              <button className="ghost-btn" onClick={() => navigate(-1)}>
                Back
              </button>
              {token ? (
                <button className="ghost-btn" onClick={() => navigate(`/custom-package?guideId=${guide?._id || ""}`)}>
                  Open bookings
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="guide-body">
          <section className="guide-panel">
            <h3>About {guide.name}</h3>
            <p className="muted">
              {guide.bio ||
                "This guide loves showing visitors around hidden corners, local eateries, and heritage spots. Reach out to plan a custom itinerary."}
            </p>
          </section>

          <section className="info-grid">
            <div>
              <h4>Location</h4>
              <p>{locationText}</p>
            </div>
            <div>
              <h4>Rating</h4>
              <p>
                {reviewStats?.averageRating || guide.averageRating || 0}/5 from{" "}
                {reviewStats?.totalReviews || guide.totalReviews || 0} reviews
              </p>
            </div>
            <div>
              <h4>Contact</h4>
              <p>{guide.email || guide.phone || "Available on request"}</p>
            </div>
          </section>

          <section className="guide-panel">
            <div className="section-heading">
              <div>
                <h3>Available experiences</h3>
                <p className="muted">Choose a guide post to create your booking request.</p>
              </div>
              {guidePosts.length ? <span className="guide-count">{guidePosts.length} trips</span> : null}
            </div>

            {guidePosts.length ? (
              <div className="guide-post-grid">
                {guidePosts.map((post) => (
                  <button
                    key={post._id}
                    type="button"
                    className={`guide-post-card ${bookingForm.postId === post._id ? "is-active" : ""}`}
                    onClick={() => setBookingForm((current) => ({ ...current, postId: post._id }))}
                  >
                    <img src={post.photo || "/default_profile.jpg"} alt={post.title || "guide post"} />
                    <div>
                      <h4>{post.title}</h4>
                      <p>{post.body || "No description available."}</p>
                      <span>Rs. {post.price ?? 0} per person</span>
                      {Number.isFinite(Number(post.price)) ? null : (
                        <small className="guide-post-warning">Update required before booking</small>
                      )}
                      <div className="post-card-details">
                        <span className="post-detail-item">
                          <i className="fa-solid fa-clock"></i> {post.duration || "Flexible duration"}
                        </span>
                        <span className="post-detail-item">
                          <i className="fa-solid fa-users"></i> {post.maxGroupSize ? `Up to ${post.maxGroupSize} people` : "Any group size"}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">This guide has not published any bookable posts yet.</p>
            )}
          </section>

          <section className="guide-split">
            <div className="guide-panel">
              <div className="section-heading">
                <div>
                  <h3>Book this guide</h3>
                  <p className="muted">Tourists can send a request directly to the selected guide post.</p>
                </div>
              </div>

              {!token ? (
                <div className="notice-box">
                  <p>Login as a tourist account to book this guide.</p>
                  <Link to="/login" className="primary-btn">
                    Login to book
                  </Link>
                </div>
              ) : !isTourist ? (
                <div className="booking-mockup-container">
                  <div className="mockup-header-badge">
                    <i className="fa-solid fa-eye"></i> This is how tourists see your booking panel
                  </div>
                  <form className="booking-form mockup-disabled" onSubmit={(e) => e.preventDefault()}>
                    <label>
                      Selected trip
                      <select name="postId" value={bookingForm.postId} disabled required>
                        {guidePosts.length ? (
                          guidePosts.map((post) => (
                            <option key={post._id} value={post._id}>
                              {post.title} - {Number.isFinite(Number(post.price)) ? `Rs. ${post.price}` : "Price unavailable"}
                            </option>
                          ))
                        ) : (
                          <option value="">No experiences created yet</option>
                        )}
                      </select>
                    </label>

                    <div className="booking-form__row">
                      <label>
                        Start date
                        <input
                          type="date"
                          name="startDate"
                          value=""
                          disabled
                          required
                        />
                      </label>

                      <label>
                        End date
                        <input
                          type="date"
                          name="endDate"
                          value=""
                          disabled
                          required
                        />
                      </label>

                      <label>
                        People
                        <input
                          type="number"
                          value="1"
                          disabled
                          required
                        />
                      </label>

                      <label>
                        Tour duration
                        <select name="durationType" disabled>
                          <option value="full-day">Full-day (8 hours)</option>
                        </select>
                      </label>
                    </div>

                    <label>
                      Special requests
                      <textarea
                        name="specialRequests"
                        rows="3"
                        disabled
                        placeholder="Pickup point, food, or timing requests"
                      />
                    </label>

                    <div className="booking-summary" style={{ opacity: 0.7 }}>
                      <span>Estimated total</span>
                      <strong>
                        {selectedPostPrice !== null
                          ? `Rs. ${selectedPostPrice}`
                          : "Unavailable"}
                      </strong>
                      <small>Full-day tour</small>
                    </div>

                    <button type="button" className="primary-btn" style={{ background: "#94a3b8", cursor: "not-allowed" }} disabled>
                      Send booking request
                    </button>
                  </form>
                </div>
              ) : !guidePosts.length ? (
                <div className="notice-box">
                  <p>No trip post is available for booking yet.</p>
                </div>
              ) : (
                <div className="booking-redirect-card" style={{ padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <p style={{ fontWeight: 600, color: "#475569", marginBottom: "16px", fontSize: "14px" }}>
                    Ready to book? Click below to select dates, set group size, and customize your experience with {guide.name}.
                  </p>
                  <button
                    type="button"
                    className="primary-btn"
                    style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: "bold" }}
                    onClick={() => {
                      const selPostId = bookingForm.postId || (guidePosts[0]?._id) || "";
                      navigate(`/custom-package?guideId=${guide._id}&postId=${selPostId}`);
                    }}
                  >
                    Book / Customize Package
                  </button>
                </div>
              )}
            </div>

            <div className="guide-panel">
              <div className="section-heading">
                <div>
                  <h3>Reviews</h3>
                  <p className="muted">Recent tourist feedback from completed bookings.</p>
                </div>
              </div>

              <div className="review-stats-card">
                <div>
                  <strong>{reviewStats?.averageRating || guide.averageRating || 0}/5</strong>
                  <span>{reviewStats?.totalReviews || guide.totalReviews || 0} total reviews</span>
                </div>
                <div className="review-bars">
                  {reviewDistribution.map((item) => (
                    <div key={item.rating} className="review-bar-row">
                      <span>{item.rating} star</span>
                      <div className="review-bar-track">
                        <div
                          className="review-bar-fill"
                          style={{
                            width: `${
                              (item.count / Math.max(reviewStats?.totalReviews || 1, 1)) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {reviews.length ? (
                <div className="review-list">
                  {reviews.map((review) => (
                    <article key={review._id} className="review-card">
                      <div className="review-card__header">
                        <div>
                          <h4>{review?.tourist?.name || "Traveler"}</h4>
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="review-score">{review.rating}/5</span>
                      </div>
                      <p>{review.comment}</p>
                      <small>{review?.post?.title || "Guided experience"}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">No reviews yet for this guide.</p>
              )}
            </div>
          </section>

          <section className="similar-guides-section">
            <h3>Similar Guides</h3>
            {similarGuides.length ? (
              <div className="similar-guides-grid">
                {similarGuides.map((g) => {
                  const gSlug = getGuideSlug(g);
                  const gImg = g.avatar || g.photo || g.image;
                  const avatarUrl = !gImg || gImg === "default-avatar-url" || gImg === "default_avatar.jpg"
                    ? "/default_profile.jpg"
                    : gImg.startsWith("http") ? gImg : `${API_BASE}/uploads/${gImg}`;
                  const gLoc = g.location
                    ? [g.location.city, g.location.state].filter(Boolean).join(", ")
                    : "Location not provided";

                  return (
                    <div key={g._id} className="similar-guide-card">
                      <Link className="similar-guide-image-link" to={`/guide/${gSlug}`}>
                        <img src={avatarUrl} alt={g.name} />
                      </Link>
                      <div className="similar-guide-card-body">
                        <Link to={`/guide/${gSlug}`}>
                          <h4>{g.name}</h4>
                        </Link>
                        <p className="similar-guide-location">{gLoc}</p>
                        <div className="similar-guide-rating">
                          <i className="fa-solid fa-star"></i>
                          <span>{g.averageRating || 0} / 5</span>
                        </div>
                        <p className="similar-guide-price">
                          Starting at Rs. {Number(g.startingPrice || 0).toLocaleString("en-IN")}
                        </p>
                        <Link to={`/guide/${gSlug}`} className="similar-guide-profile-link">
                          View Profile
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted">No similar guides found.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default GuideProfile;