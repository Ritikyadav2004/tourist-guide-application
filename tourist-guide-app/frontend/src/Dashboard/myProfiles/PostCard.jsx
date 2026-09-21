import { useRef, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loadUser } from "../../action/authActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck, faTrashAlt, faCheckCircle, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaRegComment } from "react-icons/fa";
import { toast as hotToast } from "react-hot-toast";
import { playNotificationSound } from "../../utils/playSound";

import {
  updatePost,
  deletePost,
  likePost,
  dislikePost,
  commentPost,
  getMe,
  deleteComment,
  createBooking,
  savePost,
  unsavePost,
} from "../../services/api";

import "./PostCard.css";

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

const PostCard = ({ post, refreshPosts, currentUser, showMenu = false, onUnsave }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [me, setMe] = useState(currentUser || null);
  const [liked, setLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");

  const [toast, setToast] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const triggerConfirmModal = (title, message, onConfirm) => {
    setConfirmModalConfig({ title, message, onConfirm });
    setShowConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
  };

  const menuRef = useRef();

  if (!post) return null;

  const postOwner = post?.postedBy || post?.user || null;
  const postOwnerId = postOwner?._id || null;
  const ownerName = useMemo(
    () =>
      postOwner?.name ||
      postOwner?.username ||
      postOwner?.fullName ||
      post?.name ||
      "User",
    [postOwner, post?.name]
  );

  const viewerId = (currentUser && currentUser._id) || (me && me._id) || null;
  const isOwner = viewerId ? postOwnerId === viewerId : false;
  const viewerRole = String(currentUser?.role || me?.role || "").toLowerCase();
  const isTourist = viewerRole === "tourist";
  const token = localStorage.getItem("token");
  const pricePerPerson = Number(post?.price);
  const hasBookablePrice = Number.isFinite(pricePerPerson) && pricePerPerson >= 0;

  const avatarSrc = postOwner?.avatar
    ? postOwner.avatar.startsWith("http")
      ? postOwner.avatar
      : `http://localhost:5000/uploads/${postOwner.avatar}`
    : post?.avatar || "/default_profile.jpg";

  const locationLabel = useMemo(() => {
    const loc = post?.location;
    if (!loc) return "Location not provided";
    if (typeof loc === "string") return loc;
    const city = loc.city || "";
    const state = loc.state || "";
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    if (loc.coordinates) return `${loc.coordinates}`;
    return "Location not provided";
  }, [post]);



  const handleLike = async () => {
    try {
      const res = liked ? await dislikePost(post._id) : await likePost(post._id);
      if (!res?.post) {
        throw new Error(res?.message || res?.error || "Unable to update like");
      }

      const serverLikes = Array.isArray(res?.post?.likes) ? res.post.likes : [];
      setLikes(serverLikes.length);

      const userId = (currentUser && currentUser._id) || (me && me._id);
      setLiked(Boolean(serverLikes?.some((id) => id?.toString && id.toString() === userId?.toString())));
    } catch (err) {
      console.error("Like action failed:", err);
      playNotificationSound("error");
      hotToast.error(err?.message || "Like failed", {
        duration: 3000,
        style: {
          border: "1.5px solid #ef4444",
          padding: '16px',
          color: '#b91c1c',
          fontWeight: 700,
        },
      });
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (currentUser) {
        setMe(currentUser);
      } else {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await getMe(token);
        if (mounted && res && res.success) setMe(res.user);
      }
    };
    init();
    return () => (mounted = false);
  }, [currentUser]);

  useEffect(() => {
    const userId = (currentUser && currentUser._id) || (me && me._id);
    if (userId) {
      setLiked(Boolean(post.likes?.some((id) => id?.toString && id.toString() === userId.toString())));
    }
  }, [post.likes, currentUser, me]);

  useEffect(() => {
    const activeUser = currentUser || me;
    const savedList = activeUser?.savedPosts || [];
    const isPostSaved = savedList.some(savedId => {
      const idStr = typeof savedId === "object" ? savedId._id : savedId;
      return idStr?.toString() === post._id?.toString();
    });
    setIsSaved(isPostSaved);
  }, [currentUser, me, post._id]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(`comments:${post._id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setComments(parsed);
      }
    } catch (e) {
      console.warn("Unable to read cached comments", e);
    }
  }, [post._id]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleDocumentClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    const handleScroll = () => {
      setMenuOpen(false);
    };

    document.addEventListener("click", handleDocumentClick);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [menuOpen]);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const getCommentOwnerId = (c) =>
    c?.commentedBy?._id ||
    c?.user?._id ||
    (typeof c?.commentedBy === "string" ? c.commentedBy : null) ||
    (typeof c?.user === "string" ? c.user : null);

  const persistComments = (nextComments) => {
    setComments(nextComments);
    try {
      localStorage.setItem(`comments:${post._id}`, JSON.stringify(nextComments || []));
    } catch (e) {
      console.warn("Unable to persist comments", e);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      const res = await commentPost(post._id, commentText);
      persistComments(res.post.comments);
      setCommentText("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (comment) => {
    const ownerId = getCommentOwnerId(comment);
    const viewerId = (currentUser && currentUser._id) || (me && me._id);
    if (!viewerId || !ownerId || ownerId.toString() !== viewerId.toString()) return;

    triggerConfirmModal(
      "Confirm Comment Deletion",
      "Are you sure you want to delete this comment?",
      async () => {
        try {
          const res = await deleteComment(post._id, comment._id);
          playNotificationSound("success");
          hotToast.success("Comment deleted successfully!", {
            duration: 3000,
            style: {
              border: "1.5px solid #10b981",
              padding: '16px',
              color: '#0f172a',
              fontWeight: 700,
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          });
          if (res?.post?.comments) {
            persistComments(res.post.comments);
          } else {
            const updated = comments.filter((c) => c._id !== comment._id);
            persistComments(updated);
          }
        } catch (err) {
          console.error(err);
          playNotificationSound("error");
          hotToast.error("Failed to delete comment. Please try again.", {
            duration: 3000,
            style: {
              border: "1.5px solid #ef4444",
              padding: '16px',
              color: '#b91c1c',
              fontWeight: 700,
            },
          });
        }
      }
    );
  };

  const openEdit = (type) => {
    setMenuOpen(false);
    setEditing(type);
    if (type === "title") setEditValue(post.title || "");
    if (type === "body") setEditValue(post.body || "");
    if (type === "price") setEditValue(post.price ?? "");
    if (type === "duration") setEditValue(post.duration || "");
    if (type === "maxGroupSize") setEditValue(post.maxGroupSize ?? "");
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const payload = {};
      if (editing === "title") payload.title = editValue;
      if (editing === "body") payload.body = editValue;
      if (editing === "price") payload.price = editValue;
      if (editing === "photo") payload.photoFile = editFile;
      if (editing === "duration") payload.duration = editValue;
      if (editing === "maxGroupSize") payload.maxGroupSize = editValue;

      await updatePost(post._id, payload);
      setEditing(null);
      playNotificationSound("success");
      hotToast.success("Post updated successfully!", {
        duration: 3000,
        style: {
          border: "1.5px solid #10b981",
          padding: '16px',
          color: '#0f172a',
          fontWeight: 700,
        },
        iconTheme: {
          primary: '#10b981',
          secondary: '#fff',
        },
      });
      if (refreshPosts) refreshPosts();
    } catch (err) {
      console.error(err);
      playNotificationSound("error");
      hotToast.error("Failed to update post. Please try again.", {
        duration: 3000,
        style: {
          border: "1.5px solid #ef4444",
          padding: '16px',
          color: '#b91c1c',
          fontWeight: 700,
        },
      });
    }
    setLoading(false);
  };

  const handleDelete = () => {
    triggerConfirmModal(
      "Confirm Post Deletion",
      "Are you sure you want to delete this post? This action cannot be undone.",
      async () => {
        setLoading(true);
        try {
          await deletePost(post._id);
          playNotificationSound("success");
          hotToast.success("Post deleted successfully!", {
            duration: 3000,
            style: {
              border: "1.5px solid #10b981",
              padding: '16px',
              color: '#0f172a',
              fontWeight: 700,
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          });
          if (refreshPosts) refreshPosts();
        } catch (err) {
          console.error(err);
          playNotificationSound("error");
          hotToast.error("Failed to delete post. Please try again.", {
            duration: 3000,
            style: {
              border: "1.5px solid #ef4444",
              padding: '16px',
              color: '#b91c1c',
              fontWeight: 700,
            },
          });
        }
        setLoading(false);
      }
    );
  };

  const openBookingForm = () => {
    if (!token) {
      navigate("/login");
      return;
    }
    navigate(`/custom-package?guideId=${postOwnerId || ""}&postId=${post._id}`);
  };

  const handleSaveToggle = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      if (isSaved) {
        const res = await unsavePost(post._id);
        if (res && res.success) {
          setIsSaved(false);
          hotToast.success("Removed from itinerary", {
            duration: 3000,
            style: {
              border: "1.5px solid #10b981",
              padding: '16px',
              color: '#0f172a',
              fontWeight: 700,
            },
          });
          dispatch(loadUser());
          if (onUnsave) {
            onUnsave(post._id);
          }
        } else {
          throw new Error(res?.error || res?.message || "Failed to unsave post");
        }
      } else {
        const res = await savePost(post._id);
        if (res && res.success) {
          setIsSaved(true);
          hotToast.success("Saved to your itinerary", {
            duration: 3000,
            style: {
              border: "1.5px solid #10b981",
              padding: '16px',
              color: '#0f172a',
              fontWeight: 700,
            },
          });
          dispatch(loadUser());
        } else {
          throw new Error(res?.error || res?.message || "Failed to save post");
        }
      }
    } catch (err) {
      console.error("Save toggle failed:", err);
      hotToast.error("Failed to save post. Please try again.", {
        duration: 3000,
        style: {
          border: "1.5px solid #ef4444",
          padding: '16px',
          color: '#b91c1c',
          fontWeight: 700,
        },
      });
    }
  };

  return (
    <div className="post-card">
      {/* HEADER */}
      <div className="post-header">
        <Link
          className="post-user"
          to={`/guide/${postOwnerId || encodeURIComponent(ownerName)}`}
          state={{
            fallbackGuide: {
              _id: postOwnerId,
              name: ownerName,
              avatar: postOwner?.avatar || post?.avatar,
              location: post?.location,
              price: post?.price,
            },
          }}
        >
          <img className="user-avatar" src={avatarSrc} alt={ownerName} />

          <div className="user-info">
            <span className="user-name">{ownerName}</span>
            <span className="post-location">{locationLabel}</span>
          </div>
        </Link>

        {showMenu && isOwner && (
          <div className="post-menu" ref={menuRef}>
            <i
              className="fa fa-ellipsis-v menu-icon"
              onClick={() => setMenuOpen((s) => !s)}
            />

            {menuOpen && (
              <div className="menu-dropdown">
                <button onClick={() => openEdit("title")}>Edit Title</button>
                <button onClick={() => openEdit("body")}>Edit Description</button>
                <button onClick={() => openEdit("price")}>Edit Price</button>
                <button onClick={() => openEdit("duration")}>Edit Duration</button>
                <button onClick={() => openEdit("maxGroupSize")}>Edit Max Group Size</button>
                <button onClick={() => openEdit("photo")}>Change Image</button>
                <button className="delete-btn" onClick={handleDelete} disabled={loading}>
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      {post.title && <h3 className="post-title">{post.title}</h3>}

      {/* IMAGE */}
      <div className="post-image">
        <img src={post.photo || post.image} alt="post" />
      </div>

      {/* DESCRIPTION */}
      <div className="post-description">
        <p>{post.body || post.description}</p>
      </div>

      <div className="post-price-row">
        {hasBookablePrice ? (
          <span className="post-price-badge">Rs. {Number(post.price).toLocaleString("en-IN")} / person</span>
        ) : (
          <span className="post-price-badge fallback">Contact guide for pricing</span>
        )}
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && createPortal(
        <div className={`post-toast post-toast--${toast.type}`} onClick={() => setToast(null)}>
          <FontAwesomeIcon
            icon={toast.type === "success" ? faCheckCircle : faExclamationCircle}
            className="post-toast__icon"
          />
          <span className="post-toast__message">{toast.message}</span>
        </div>,
        document.body
      )}

      {/* ACTION BUTTONS */}
      <div className="post-actions">
        <div className="post-actions__engagement">
          <button
            className={`like-btn ${liked ? "is-liked" : ""}`}
            onClick={handleLike}
            aria-pressed={liked}
            title={liked ? "Unlike" : "Like"}
          >
            {liked ? (
              <FaHeart className="engagement-icon heart-solid" />
            ) : (
              <FaRegHeart className="engagement-icon heart-outline" />
            )}
            <span className="count">{likes}</span>
          </button>

          <button
            className="comment-btn"
            onClick={() => setShowCommentBox(!showCommentBox)}
            title="Comments"
          >
            <FaRegComment className="engagement-icon comment-outline" />
            <span className="count">{comments.length}</span>
          </button>

          <button
            className={`save-btn-icon ${isSaved ? "is-saved" : ""}`}
            onClick={handleSaveToggle}
            title={isSaved ? "Remove from itinerary" : "Save to itinerary"}
          >
            {isSaved ? (
              <FaBookmark className="engagement-icon bookmark-solid" />
            ) : (
              <FaRegBookmark className="engagement-icon bookmark-outline" />
            )}
          </button>
        </div>

        <div className="post-actions__primary">
          <button
            className="book-btn"
            type="button"
            onClick={openBookingForm}
            disabled={!hasBookablePrice}
            title={hasBookablePrice ? "Book this guide post" : "Price required before booking"}
          >
            <FontAwesomeIcon icon={faCalendarCheck} />
            <span>Book</span>
          </button>
        </div>
      </div>

      {/* COMMENTS PANEL */}
      {showCommentBox && (
        <div className="comments-panel" role="dialog" aria-label="comments">
          <div className="panel-header">
            <strong>Comments</strong>
            <button
              type="button"
              className="close-panel"
              onClick={() => setShowCommentBox(false)}
            >
              Close
            </button>
          </div>

          <div className="panel-list">
            {comments.length === 0 ? (
              <div className="empty">No comments yet.</div>
            ) : (
              comments.map((c, i) => {
                const ownerName = c.commentedBy?.name || c.user?.name || "User";
                const ownerId = getCommentOwnerId(c);
                const viewerId = (currentUser && currentUser._id) || (me && me._id);
                const canDelete =
                  viewerId && ownerId && ownerId.toString() === viewerId.toString();

                return (
                  <div key={i} className="comment-item">
                    <strong>{ownerName}:</strong>
                    <span className="comment-text"> {c.text}</span>
                    {canDelete && (
                      <button
                        type="button"
                        className="comment-delete"
                        onClick={() => handleDeleteComment(c)}
                        aria-label="Delete comment"
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="panel-input">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="button" onClick={handleComment}>Post</button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editing && (
        <div className="edit-modal">
          <div className="edit-panel">
            <h4>
              {editing === "title"
                ? "Edit Title"
                : editing === "body"
                ? "Edit Description"
                : editing === "price"
                ? "Edit Price"
                : editing === "duration"
                ? "Edit Duration"
                : editing === "maxGroupSize"
                ? "Edit Max Group Size"
                : "Change Image"}
            </h4>

            {(editing === "title" || editing === "body" || editing === "price" || editing === "duration" || editing === "maxGroupSize") && (
              editing === "title" ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              ) : editing === "price" ? (
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              ) : editing === "maxGroupSize" ? (
                <input
                  type="number"
                  min="1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              ) : editing === "duration" ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              ) : (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              )
            )}

            {editing === "photo" && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditFile(e.target.files[0] || null)}
              />
            )}

            <div className="edit-actions">
              <button onClick={() => setEditing(null)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleUpdate} disabled={loading} className="save-btn">
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="p-modal-backdrop" onClick={handleCloseConfirmModal}>
          <div className="p-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{confirmModalConfig.title}</h2>
            <p>{confirmModalConfig.message}</p>
            <div className="p-modal-buttons">
              <button className="btn-modal-cancel" onClick={handleCloseConfirmModal}>Cancel</button>
              <button className="btn-modal-confirm" onClick={() => {
                confirmModalConfig.onConfirm();
                handleCloseConfirmModal();
              }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
