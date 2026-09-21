import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loadUser } from "../action/authActions";
import DashboardLayout from "../Dashboard/DashboardLayout";
import { getSavedPosts, unsavePost } from "../services/api";
import { playNotificationSound } from "../utils/playSound";
import { FaBookmark, FaRegBookmark, FaUser, FaCompass, FaPhone, FaMapMarkerAlt, FaGlobe, FaTrash } from "react-icons/fa";
import "./Settings.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const getImageSrc = (src) => {
  if (!src || src === "default-avatar-url" || src === "default_avatar.jpg") {
    return "/default_profile.jpg";
  }
  if (src.startsWith("blob:") || src.startsWith("http")) return src;
  return `${API_BASE}/uploads/${src}`;
};

const formatLocation = (location) => {
  if (!location) return { city: "", state: "" };
  if (typeof location === "string") {
    const [city, state] = location.split(",").map((part) => part.trim());
    return { city: city || "", state: state || "" };
  }
  return {
    city: location.city || "",
    state: location.state || "",
  };
};

const formatLanguages = (languages) => {
  if (Array.isArray(languages)) return languages.join(", ");
  return languages || "";
};

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("saved-posts"); // default to Saved Posts as requested
  const [savedPosts, setSavedPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [updating, setUpdating] = useState(false);

  // Profile Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    avatar: "",
    languages: "",
    location: { city: "", state: "" },
  });
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!user && !loading) {
      dispatch(loadUser());
    }
  }, [token, user, loading, dispatch, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
        languages: formatLanguages(user.languages),
        location: formatLocation(user.location),
      });
    }
  }, [user]);

  // Fetch saved posts when activeTab is "saved-posts"
  const fetchSaved = async () => {
    if (!token) return;
    setPostsLoading(true);
    try {
      const res = await getSavedPosts();
      if (res && res.success) {
        setSavedPosts(res.savedPosts || []);
      } else {
        toast.error("Failed to load saved posts");
      }
    } catch (err) {
      console.error("Failed to fetch saved posts:", err);
      toast.error("Failed to load saved posts");
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "saved-posts" && token) {
      fetchSaved();
    }
  }, [activeTab, token]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setFormData({ ...formData, avatar: imageURL });
      setAvatarFile(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setStatusMessage("");

    try {
      const form = new FormData();
      form.append("name", formData.name || "");
      form.append("phone", formData.phone || "");
      form.append("languages", formData.languages || "");
      form.append("location", JSON.stringify(formData.location));
      if (avatarFile) form.append("avatar", avatarFile);

      const res = await fetch(`/api/users/me/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Profile updated successfully!");
        playNotificationSound("success");
        dispatch(loadUser());
        setAvatarFile(null);
      } else {
        toast.error(data?.message || "Unable to update profile.");
        playNotificationSound("error");
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Error updating profile.");
      playNotificationSound("error");
    } finally {
      setUpdating(false);
    }
  };

  const handleUnsave = async (postId) => {
    try {
      const res = await unsavePost(postId);
      if (res && res.success) {
        toast.success("Removed from itinerary");
        playNotificationSound("success");
        setSavedPosts((curr) => curr.filter((p) => p._id !== postId));
        dispatch(loadUser()); // Sync with feed bookmark icons
      } else {
        toast.error("Failed to unsave post");
        playNotificationSound("error");
      }
    } catch (err) {
      console.error("Unsave failed:", err);
      toast.error("Failed to unsave post");
      playNotificationSound("error");
    }
  };

  if (loading || !user) {
    return (
      <DashboardLayout>
        <div className="settings-loading">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="settings-container">
        {/* HERO SECTION */}
        <div className="settings-hero">
          <div>
            <p className="settings-eyebrow">User Space</p>
            <h1>Account Settings</h1>
            <p>Manage your profile preferences and view your saved itinerary posts.</p>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="settings-tabs">
          <button
            className={`settings-tab-btn ${activeTab === "saved-posts" ? "active" : ""}`}
            onClick={() => setActiveTab("saved-posts")}
          >
            <FaCompass style={{ marginRight: "8px" }} /> My Itinerary
          </button>
          <button
            className={`settings-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <FaUser style={{ marginRight: "8px" }} /> Profile Details
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="settings-tab-content">
          {/* PROFILE SETTINGS TAB */}
          {activeTab === "profile" && (
            <div className="profile-settings-card">
              <div className="profile-settings-header">
                <h2>Edit Personal Information</h2>
                <p>Keep your contact details and location updated for guides.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="profile-settings-form">
                <div className="avatar-uploader-section">
                  <div className="avatar-preview-container">
                    <img
                      src={getImageSrc(formData.avatar)}
                      alt={user.name || "avatar"}
                      onError={(e) => {
                        e.target.src = "/default_profile.jpg";
                      }}
                    />
                  </div>
                  <label className="avatar-upload-btn">
                    Upload New Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      hidden
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <div className="settings-input-group">
                    <label><FaUser className="input-icon" /> Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div className="settings-input-group">
                    <label><FaPhone className="input-icon" /> Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your 10-digit number"
                    />
                  </div>

                  <div className="settings-input-group">
                    <label><FaGlobe className="input-icon" /> Languages</label>
                    <input
                      type="text"
                      name="languages"
                      value={formData.languages}
                      onChange={handleInputChange}
                      placeholder="English, Spanish, Hindi, etc."
                    />
                  </div>

                  <div className="settings-input-group">
                    <label><FaMapMarkerAlt className="input-icon" /> City</label>
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) =>
                        setFormData((current) => ({
                          ...current,
                          location: { ...current.location, city: e.target.value },
                        }))
                      }
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="settings-input-group">
                    <label><FaMapMarkerAlt className="input-icon" /> State</label>
                    <input
                      type="text"
                      value={formData.location.state}
                      onChange={(e) =>
                        setFormData((current) => ({
                          ...current,
                          location: { ...current.location, state: e.target.value },
                        }))
                      }
                      placeholder="Enter state"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-settings-btn" disabled={updating}>
                    {updating ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SAVED POSTS TAB */}
          {activeTab === "saved-posts" && (
            <div className="saved-posts-container">
              {postsLoading ? (
                <div className="saved-posts-loading">
                  <div className="spinner"></div>
                  <p>Fetching saved items...</p>
                </div>
              ) : savedPosts.length === 0 ? (
                <div className="saved-posts-empty">
                  <div className="empty-icon">
                    <FaRegBookmark />
                  </div>
                  <h3>Your itinerary is empty</h3>
                  <p>Bookmark posts from the home feed to save destinations and plans here.</p>
                  <Link to="/" className="explore-btn">
                    Explore Destinations
                  </Link>
                </div>
              ) : (
                <div className="saved-posts-grid">
                  {savedPosts.map((post) => {
                    const postGuide = post.postedBy || {};
                    const guideName = postGuide.name || "Unknown Guide";
                    const price = post.price ? `Rs. ${Number(post.price).toLocaleString("en-IN")}` : "Contact for price";

                    return (
                      <div className="saved-post-card" key={post._id}>
                        <div className="saved-post-image">
                          <img
                            src={post.photo || post.image}
                            alt={post.title}
                            onError={(e) => {
                              e.target.src = "/fallback-destination.jpg";
                            }}
                          />
                          <div className="saved-post-price">{price}</div>
                        </div>
                        <div className="saved-post-info">
                          <h3 className="saved-post-title">{post.title}</h3>
                          <div className="saved-post-guide-row">
                            <img
                              src={getImageSrc(postGuide.avatar)}
                              alt={guideName}
                              className="saved-post-guide-avatar"
                              onError={(e) => {
                                e.target.src = "/default_profile.jpg";
                              }}
                            />
                            <span className="saved-post-guide-name">{guideName}</span>
                          </div>
                          <div className="saved-post-card-actions">
                            <Link to={`/state/${post.location?.state || ""}`} className="details-link-btn">
                              View Guide
                            </Link>
                            <button
                              type="button"
                              className="unsave-card-btn"
                              onClick={() => handleUnsave(post._id)}
                              title="Unsave post"
                            >
                              <FaTrash style={{ marginRight: "6px" }} /> Unsave
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
