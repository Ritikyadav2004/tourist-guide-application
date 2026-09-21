import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../../Dashboard/DashboardLayout";
import AssetSelector from "../../components/custom-package/AssetSelector";
import PackageSummary from "../../components/custom-package/PackageSummary";
import { createNewBooking } from "../../slices/bookingSlice";
import { estimateCustomPackage, saveCustomPackage } from "../../slices/customPackageSlice";
import { getGuideAssets, getGuideTemplates, getGuides, getPost, getPosts, getGuideAvailability } from "../../services/api";
import "../CustomPackageBuilder.css";

const today = () => new Date().toISOString().slice(0, 10);

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

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

const formatDisplayDate = (value) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}-${month}-${year}`;
};

const getImage = (guide) => {
  const src = guide?.avatar || guide?.photo || guide?.image;
  if (!src || src === "default-avatar-url" || src === "default_avatar.jpg") return "/default_profile.jpg";
  return src.startsWith("http") ? src : `http://localhost:5000/uploads/${src}`;
};

const CustomPackageBuilder = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { token } = useSelector((state) => state.auth);
  const packageState = useSelector((state) => state.customPackage || {});

  const guideId = searchParams.get("guideId") || "";
  const postId = searchParams.get("postId") || "";

  const [guide, setGuide] = useState(null);
  const [post, setPost] = useState(null);
  const [assets, setAssets] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState({});
  const [guidePosts, setGuidePosts] = useState([]);
  const [availability, setAvailability] = useState({ blockedRanges: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    startDate: today(),
    endDate: addDays(2),
    numberOfPeople: 2,
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [guidesData, postsData, assetsData, templatesData] = await Promise.all([
          getGuides(),
          getPosts(1, 200),
          guideId ? getGuideAssets(guideId) : Promise.resolve({ assets: [] }),
          guideId ? getGuideTemplates(guideId) : Promise.resolve({ templates: [] }),
        ]);

        let resolvedPost = null;
        let resolvedGuide = null;

        if (postId) {
          try {
            const postRes = await getPost(postId);
            resolvedPost = postRes?.post || postRes;
            resolvedGuide = resolvedPost?.postedBy || null;
          } catch (err) {
            console.error("Failed to fetch post details:", err);
          }
        }

        if (!resolvedGuide && guideId) {
          const guides = Array.isArray(guidesData?.guides) ? guidesData.guides : Array.isArray(guidesData) ? guidesData : [];
          resolvedGuide = guides.find((item) => String(item._id) === String(guideId)) || null;
        }

        const posts = Array.isArray(postsData?.posts) ? postsData.posts : [];
        const guideIdToMatch = resolvedGuide?._id || guideId;
        const filteredPosts = posts.filter(
          (item) => String(item?.postedBy?._id || item?.postedBy) === String(guideIdToMatch)
        );
        setGuidePosts(filteredPosts);

        if (!resolvedPost && filteredPosts.length > 0) {
          resolvedPost = filteredPosts[0];
        }

        let availabilityData = { blockedRanges: [], bookings: [] };
        if (guideIdToMatch) {
          try {
            const from = today();
            const to = addDays(27);
            const availRes = await getGuideAvailability(guideIdToMatch, { from, to });
            availabilityData = availRes?.availability || { blockedRanges: [], bookings: [] };
          } catch (err) {
            console.error("Failed to load availability:", err);
          }
        }

        setGuide(resolvedGuide);
        setPost(resolvedPost);
        setAvailability(availabilityData);
        setAssets(Array.isArray(assetsData?.assets) ? assetsData.assets : []);
        setTemplates(Array.isArray(templatesData?.templates) ? templatesData.templates : []);
      } catch (err) {
        setError(err?.message || "Unable to load custom package data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [guideId, navigate, postId, token]);

  const days = useMemo(() => {
    const start = new Date(`${form.startDate}T00:00:00`);
    const end = new Date(`${form.endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;
    return Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)) + 1);
  }, [form.endDate, form.startDate]);

  const availabilityDays = useMemo(() => {
    const firstDay = today();
    return Array.from({ length: 21 }, (_, index) => {
      const value = addDaysInputValue(firstDay, index);
      const booked = availability.bookings?.find((range) => dateInRange(value, range));
      const blocked = availability.blockedRanges?.find((range) => dateInRange(value, range));
      return {
        value,
        label: new Date(`${value}T00:00:00.000Z`).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
        }),
        state: booked ? "booked" : blocked ? "blocked" : "available",
        note: booked?.post?.title || blocked?.reason || "",
      };
    });
  }, [availability]);

  const handleCalendarDayClick = (dayValue) => {
    setForm((current) => {
      if (!current.startDate || (current.startDate && current.endDate) || dayValue < current.startDate) {
        return {
          ...current,
          startDate: dayValue,
          endDate: "",
        };
      }
      return {
        ...current,
        endDate: dayValue,
      };
    });
  };

  const selectedAssetList = useMemo(() => Object.values(selectedAssets), [selectedAssets]);
  const guidePrice = Number(post?.price || guide?.price || 0);
  const estimate = packageState.estimate?.estimate || packageState.estimate || null;

  const handleAddAsset = (asset) => {
    setSelectedAssets((current) => ({
      ...current,
      [asset._id]: {
        assetId: asset._id,
        name: asset.name,
        type: asset.type || asset.category || "other",
        pricePerDay: Number(asset.pricePerDay || asset.price || 0),
        quantity: 1,
      },
    }));
  };

  const handleRemoveAsset = (assetId) => {
    setSelectedAssets((current) => {
      const next = { ...current };
      delete next[assetId];
      return next;
    });
  };

  const handleQuantityChange = (assetId, quantity) => {
    setSelectedAssets((current) => ({
      ...current,
      [assetId]: { ...current[assetId], quantity: Number(quantity) },
    }));
  };

  const packagePayload = () => ({
    guideId,
    postId: post?._id || "",
    startDate: form.startDate,
    endDate: form.endDate,
    numberOfPeople: Number(form.numberOfPeople),
    selectedAssets: selectedAssetList.map((asset) => ({ assetId: asset.assetId, quantity: asset.quantity })),
  });

  const validate = () => {
    if (!guideId) return "Choose a guide before building a package.";
    if (!form.startDate || !form.endDate) return "Select both start and end dates.";
    if (new Date(form.endDate) < new Date(form.startDate)) return "End date cannot be before start date.";
    if (Number(form.numberOfPeople) < 1 || Number(form.numberOfPeople) > 20) return "People must be between 1 and 20.";
    return "";
  };

  const handleEstimate = async () => {
    const message = validate();
    if (message) return setError(message);
    setError("");
    try {
      await dispatch(estimateCustomPackage(packagePayload())).unwrap();
    } catch (err) {
      setError(err?.message || "Unable to calculate estimate.");
    }
  };

  const handleSave = async () => {
    const message = validate();
    if (message) return setError(message);
    setError("");
    try {
      const saveResult = await dispatch(saveCustomPackage(packagePayload())).unwrap();
      const customPackage = saveResult?.customPackage || saveResult?.package || saveResult;
      const customPackageId = customPackage?._id;
      if (!customPackageId) throw new Error("Failed to save custom package details.");

      const bookingResult = await dispatch(createNewBooking({ customPackageId, specialRequests: "" })).unwrap();
      const booking = bookingResult?.booking || bookingResult;
      navigate(booking?._id ? `/dashboard/payment?bookingId=${booking._id}` : `/custom-package/success?packageId=${customPackageId}`);
    } catch (err) {
      setError(err?.message || "Unable to save package and create booking.");
    }
  };

  const applyTemplate = (template) => {
    const next = {};
    (template.assets || []).forEach((item) => {
      const assetId = item.assetId?._id || item.assetId;
      const asset = assets.find((entry) => String(entry._id) === String(assetId));
      if (!asset) return;
      next[asset._id] = {
        assetId: asset._id,
        name: asset.name,
        type: asset.type || asset.category || "other",
        pricePerDay: Number(item.fixedPrice || asset.pricePerDay || asset.price || 0),
        quantity: Number(item.quantity || 1),
      };
    });
    setSelectedAssets(next);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <main className="custom-package-page">
          <div className="custom-loading-card">Loading custom package builder...</div>
        </main>
      </DashboardLayout>
    );
  }

  if (!guideId || !guide) {
    return (
      <DashboardLayout>
        <main className="custom-package-empty-state">
          <div className="custom-package-empty-card">
            <div className="custom-package-empty-icon" aria-hidden="true"><i className="fa-solid fa-user-check"></i></div>
            <h2>Select a Guide First</h2>
            <p>Custom packages require selecting a specific guide first. Browse guides, open a profile, and click "Customize Package".</p>
            <Link to="/dashboard" className="custom-package-empty-link">Browse Available Guides</Link>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="custom-package-page"
      >
        <div className="custom-package-shell">
          <header className="custom-package-hero">
            <button type="button" className="custom-back-button" onClick={() => navigate(-1)}>
              <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
              <span>Back</span>
            </button>
            <div className="custom-hero-main">
              <div className="custom-guide-card">
                <img src={getImage(guide)} alt={guide?.name || "Guide"} className="custom-guide-avatar" />
                <div className="custom-guide-copy">
                  <p className="custom-eyebrow">Custom package</p>
                  <h1>{guide?.name || "Selected guide"}</h1>
                  <div className="custom-rating-row" aria-label={`Rating ${guide?.averageRating || 0} out of 5`}>
                    <span className="custom-stars" aria-hidden="true">
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-regular fa-star"></i>
                    </span>
                    <span>{guide?.averageRating || 0}/5</span>
                    <span className="custom-dot">•</span>
                    <span>{post?.title || "Flexible local experience"}</span>
                  </div>
                </div>
              </div>
              <div className="custom-base-fee-card">
                <span>Base guide fee</span>
                <strong>Rs. {guidePrice.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </header>

          {error || packageState.error ? <div className="custom-error-banner">{error || packageState.error}</div> : null}

          <section className="trip-basics-card">
            <div className="custom-section-heading">
              <p>Select experience & dates</p>
              <h2>Trip basics</h2>
            </div>

            {/* Selected Trip Dropdown */}
            <div className="trip-basics-dropdown-container" style={{ margin: "16px 0 24px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>
                <span>Select Experience / Trip</span>
                <select
                  value={post?._id || ""}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const found = guidePosts.find((p) => p._id === selectedId);
                    setPost(found || null);
                  }}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "15px",
                    backgroundColor: "#fff",
                    fontWeight: "600",
                    color: "#1e293b",
                    cursor: "pointer",
                    width: "100%",
                    outline: "none",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                  }}
                >
                  <option value="">Custom Package (No trip selected)</option>
                  {guidePosts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title} - Rs. {p.price}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Availability Calendar */}
            <div className="custom-section-heading" style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p>Guide availability calendar</p>
                <h3 style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", margin: "4px 0 12px" }}>
                  Click a start date, then click an end date to select your trip range.
                </h3>
              </div>
              {(form.startDate || form.endDate) && (
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, startDate: "", endDate: "" }))}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0f766e",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    padding: "4px 8px"
                  }}
                >
                  Clear dates
                </button>
              )}
            </div>
            <div className="post-availability-grid" aria-label="Guide availability calendar" style={{ marginBottom: "24px" }}>
              {availabilityDays.map((day) => {
                const isSelectedStart = form.startDate === day.value;
                const isSelectedEnd = form.endDate === day.value;
                const isInRange =
                  form.startDate &&
                  form.endDate &&
                  day.value >= form.startDate &&
                  day.value <= form.endDate;

                let stateClass = `is-${day.state}`;
                if (isSelectedStart) stateClass += " is-start-date";
                if (isSelectedEnd) stateClass += " is-end-date";
                if (isInRange) stateClass += " is-in-range";

                return (
                  <button
                    key={day.value}
                    type="button"
                    className={`post-availability-day ${stateClass}`}
                    disabled={day.state !== "available"}
                    title={day.note || day.state}
                    onClick={() => handleCalendarDayClick(day.value)}
                  >
                    <span>{day.label}</span>
                    <small>{day.state}</small>
                  </button>
                );
              })}
            </div>

            <div className="trip-basics-grid">
              <label className="trip-field-card">
                <span><i className="fa-regular fa-calendar" aria-hidden="true"></i> Start date</span>
                <strong>{form.startDate ? formatDisplayDate(form.startDate) : "Not selected"}</strong>
                <input type="date" min={today()} value={form.startDate || ""} aria-label="Start date" onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
              </label>
              <label className="trip-field-card">
                <span><i className="fa-regular fa-calendar-check" aria-hidden="true"></i> End date</span>
                <strong>{form.endDate ? formatDisplayDate(form.endDate) : "Not selected"}</strong>
                <input type="date" min={form.startDate || today()} value={form.endDate || ""} aria-label="End date" onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
              </label>
              <label className="trip-field-card">
                <span><i className="fa-solid fa-users" aria-hidden="true"></i> Number of people</span>
                <strong>{form.numberOfPeople}</strong>
                <input type="number" min="1" max="20" value={form.numberOfPeople} aria-label="Number of people" onChange={(event) => setForm((current) => ({ ...current, numberOfPeople: event.target.value }))} />
              </label>
            </div>
          </section>

          {templates.length ? (
            <section className="custom-template-section">
              <div className="custom-section-heading">
                <p>Package templates</p>
                <h2>Start from a proven setup</h2>
              </div>
              <div className="custom-template-grid">
                {templates.map((template) => (
                  <article key={template._id} className="custom-template-card">
                    <h3>{template.name}</h3>
                    <p>{template.description || "Pre-built asset combination."}</p>
                    <button type="button" className="custom-secondary-button" onClick={() => applyTemplate(template)}>Apply template</button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <div className="custom-builder-layout">
            <div className="custom-builder-main">
              <AssetSelector assets={assets} selectedAssets={selectedAssets} onAdd={handleAddAsset} onRemove={handleRemoveAsset} onQuantityChange={handleQuantityChange} />
            </div>
            <div className="custom-builder-sidebar">
              <PackageSummary selectedAssets={selectedAssetList} days={days} people={Number(form.numberOfPeople || 1)} guidePrice={guidePrice} estimate={estimate} onEstimate={handleEstimate} onSave={handleSave} estimating={packageState.estimating} saving={packageState.saving} />
            </div>
          </div>

          <div className="custom-status-bar" aria-label="Local status">
            <span><i className="fa-solid fa-cloud-sun" aria-hidden="true"></i> 31°C</span>
            <span>Mostly cloudy</span>
            <span><i className="fa-solid fa-language" aria-hidden="true"></i> ENG</span>
            <span><i className="fa-solid fa-location-dot" aria-hidden="true"></i> IN</span>
            <span><i className="fa-regular fa-clock" aria-hidden="true"></i> 17:05</span>
            <span>18-08-2026</span>
          </div>
        </div>
      </motion.main>
    </DashboardLayout>
  );
};

export default CustomPackageBuilder;
