// import { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { Link, useNavigate } from "react-router-dom";
// import DashboardLayout from "../Dashboard/DashboardLayout";
// import { loadUser } from "../action/authActions";
// import {
//   deletePost,
//   getAdminBookingStats,
//   getAdminUsers,
//   getGuides,
//   getPosts,
//   updateUserBlockStatus,
// } from "../services/api";
// import "./AdminPanel.css";

// const emptyStats = {
//   total: 0,
//   pending: 0,
//   processing: 0,
//   completed: 0,
//   cancelled: 0,
//   tripsDone: 0,
// };

// export default function AdminPanel() {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { user, token, loading } = useSelector((state) => state.auth);

//   const [posts, setPosts] = useState([]);
//   const [guides, setGuides] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [bookingStats, setBookingStats] = useState(emptyStats);
//   const [pageLoading, setPageLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [message, setMessage] = useState("");
//   const [busyId, setBusyId] = useState("");
//   const [deletingPostId, setDeletingPostId] = useState("");

//   useEffect(() => {
//     if (!token) {
//       navigate("/login");
//       return;
//     }

//     if (!user && !loading) {
//       dispatch(loadUser());
//     }
//   }, [token, user, loading, dispatch, navigate]);

//   const role = (user?.role || "").toLowerCase();
//   const isAdmin = role === "admin";

//   const blockedUsers = useMemo(
//     () => users.filter((item) => item?.isBlocked).length,
//     [users]
//   );

//   const loadAdminData = async () => {
//     if (!isAdmin) return;

//     setPageLoading(true);
//     setError("");

//     try {
//       const [postResponse, guideResponse, userResponse, statsResponse] = await Promise.all([
//         getPosts(1, 200),
//         getGuides(),
//         getAdminUsers(),
//         getAdminBookingStats(),
//       ]);

//       setPosts(Array.isArray(postResponse?.posts) ? postResponse.posts : []);
//       setGuides(Array.isArray(guideResponse?.guides) ? guideResponse.guides : []);
//       setUsers(Array.isArray(userResponse?.users) ? userResponse.users : []);
//       setBookingStats(statsResponse?.stats || emptyStats);
//     } catch (requestError) {
//       setError(requestError?.message || "Unable to load admin dashboard.");
//     } finally {
//       setPageLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (isAdmin) loadAdminData();
//   }, [isAdmin]);

//   const handleDeletePost = async (postId) => {
//     if (!postId || !isAdmin) return;

//     const confirmed = window.confirm("Delete this post from the platform?");
//     if (!confirmed) return;

//     setDeletingPostId(postId);
//     setError("");
//     setMessage("");

//     try {
//       const response = await deletePost(postId);
//       if (response?.success || response?.message) {
//         setPosts((current) => current.filter((post) => post._id !== postId));
//         setMessage(response?.message || "Post deleted.");
//       } else {
//         setError(response?.message || "Unable to delete post.");
//       }
//     } catch (requestError) {
//       setError(requestError?.message || "Unable to delete post.");
//     } finally {
//       setDeletingPostId("");
//     }
//   };

//   const handleToggleBlock = async (targetUser) => {
//     if (!targetUser?._id || !isAdmin) return;

//     const nextBlocked = !targetUser.isBlocked;
//     const reason = nextBlocked ? window.prompt("Reason for suspension", "Bad user behavior") : "";
//     if (nextBlocked && reason === null) return;

//     setBusyId(targetUser._id);
//     setError("");
//     setMessage("");

//     try {
//       const response = await updateUserBlockStatus(targetUser._id, {
//         isBlocked: nextBlocked,
//         reason,
//       });

//       setUsers((current) =>
//         current.map((item) =>
//           item._id === targetUser._id ? { ...item, ...response.user } : item
//         )
//       );
//       setMessage(response?.message || "User updated.");
//     } catch (requestError) {
//       setError(requestError?.message || "Unable to update user.");
//     } finally {
//       setBusyId("");
//     }
//   };

//   return (
//     <DashboardLayout>
//       <section className="admin-panel">
//         <div className="admin-panel__hero">
//           <div>
//             <p className="admin-panel__eyebrow">Admin Dashboard</p>
//             <h1>Moderation and trip overview</h1>
//             <p className="admin-panel__intro">
//               Review platform activity, booking progress, and suspend bad users from one place.
//             </p>
//           </div>
//           <div className="admin-panel__meta">
//             <span className={`admin-panel__badge ${isAdmin ? "is-admin" : "is-guest"}`}>
//               {isAdmin ? "Admin Access" : "No Admin Access"}
//             </span>
//             <p>{user?.email || "Sign in to continue"}</p>
//           </div>
//         </div>

//         {!loading && user && !isAdmin ? (
//           <div className="admin-panel__blocked">
//             <h2>Access restricted</h2>
//             <p>
//               Your account role is <strong>{user.role || "unknown"}</strong>. Only admin accounts
//               can open this panel.
//             </p>
//           </div>
//         ) : null}

//         {isAdmin ? (
//           <>
//             <div className="admin-panel__stats">
//               <article className="admin-panel__stat-card">
//                 <span className="admin-panel__stat-label">Trips Done</span>
//                 <strong>{bookingStats.tripsDone}</strong>
//                 <small>Completed bookings</small>
//               </article>
//               <article className="admin-panel__stat-card">
//                 <span className="admin-panel__stat-label">Processing</span>
//                 <strong>{bookingStats.processing}</strong>
//                 <small>Confirmed requests</small>
//               </article>
//               <article className="admin-panel__stat-card">
//                 <span className="admin-panel__stat-label">Pending</span>
//                 <strong>{bookingStats.pending}</strong>
//                 <small>Requests waiting</small>
//               </article>
//               <article className="admin-panel__stat-card">
//                 <span className="admin-panel__stat-label">Complete</span>
//                 <strong>{bookingStats.completed}</strong>
//                 <small>Finished trips</small>
//               </article>
//               <article className="admin-panel__stat-card">
//                 <span className="admin-panel__stat-label">Guides</span>
//                 <strong>{guides.length}</strong>
//                 <small>Verified guide profiles</small>
//               </article>
//               <article className="admin-panel__stat-card">
//                 <span className="admin-panel__stat-label">Suspended</span>
//                 <strong>{blockedUsers}</strong>
//                 <small>Blocked accounts</small>
//               </article>
//             </div>

//             <div className="admin-panel__section-head">
//               <div className="admin-panel__section-title">
//                 <h2>Admin Controls</h2>
//                 <p>Posts are created by guides only. Admin can moderate posts and users.</p>
//               </div>
//               <button
//                 type="button"
//                 className="admin-panel__secondary-btn"
//                 onClick={loadAdminData}
//                 disabled={pageLoading}
//               >
//                 {pageLoading ? "Refreshing..." : "Refresh Dashboard"}
//               </button>
//             </div>

//             {message ? <div className="admin-panel__message is-success">{message}</div> : null}
//             {error ? <div className="admin-panel__message is-error">{error}</div> : null}

//             <section className="admin-panel__card">
//               <div className="admin-panel__section-head">
//                 <div className="admin-panel__section-title">
//                   <h2>User Suspension</h2>
//                   <p>Block or restore tourists and guides.</p>
//                 </div>
//               </div>

//               <div className="admin-panel__user-list">
//                 {users.map((item) => (
//                   <article key={item._id} className="admin-panel__user-row">
//                     <div>
//                       <h3>{item.name || "Unnamed user"}</h3>
//                       <p>{item.email}</p>
//                       <span>{item.role}</span>
//                       {item.isBlocked && item.blockedReason ? (
//                         <small>Reason: {item.blockedReason}</small>
//                       ) : null}
//                     </div>
//                     <div className="admin-panel__user-actions">
//                       <span className={item.isBlocked ? "is-blocked" : "is-active"}>
//                         {item.isBlocked ? "Suspended" : "Active"}
//                       </span>
//                       <button
//                         type="button"
//                         className={item.isBlocked ? "admin-panel__secondary-btn" : "admin-panel__delete-btn"}
//                         disabled={busyId === item._id || item._id === user?._id}
//                         onClick={() => handleToggleBlock(item)}
//                       >
//                         {busyId === item._id
//                           ? "Saving..."
//                           : item.isBlocked
//                           ? "Restore"
//                           : "Suspend"}
//                       </button>
//                     </div>
//                   </article>
//                 ))}
//               </div>
//             </section>

//             <section className="admin-panel__card">
//               <div className="admin-panel__section-head">
//                 <div className="admin-panel__section-title">
//                   <h2>Post Moderation</h2>
//                   <p>Remove unsafe or invalid guide posts.</p>
//                 </div>
//               </div>

//               <div className="admin-panel__list">
//                 {posts.map((post) => {
//                   const image = post?.photo || post?.image || "/default_profile.jpg";
//                   const locationText =
//                     typeof post?.location === "string"
//                       ? post.location
//                       : [post?.location?.city, post?.location?.state].filter(Boolean).join(", ");

//                   return (
//                     <article key={post._id} className="admin-panel__item">
//                       <img src={image} alt={post?.title || "post"} className="admin-panel__item-image" />
//                       <div className="admin-panel__item-body">
//                         <h3>{post?.title || "Untitled post"}</h3>
//                         <p>{post?.body || post?.description || "No description available."}</p>
//                         <div className="admin-panel__item-meta">
//                           <span>{locationText || "Location not provided"}</span>
//                           <span>{post?.price !== undefined ? `Rs. ${post.price}` : "No price"}</span>
//                           <span>{post?.likes?.length || 0} likes</span>
//                         </div>
//                         <div className="admin-panel__item-actions">
//                           <button
//                             type="button"
//                             className="admin-panel__delete-btn"
//                             onClick={() => handleDeletePost(post._id)}
//                             disabled={deletingPostId === post._id}
//                           >
//                             {deletingPostId === post._id ? "Deleting..." : "Delete Post"}
//                           </button>
//                         </div>
//                       </div>
//                     </article>
//                   );
//                 })}
//                 {!posts.length && !pageLoading ? (
//                   <p className="admin-panel__empty">No posts loaded yet.</p>
//                 ) : null}
//               </div>
//             </section>

//             <section className="admin-panel__card">
//               <div className="admin-panel__section-head">
//                 <div className="admin-panel__section-title">
//                   <h2>Guide Directory</h2>
//                   <p>Open guide profiles directly from the admin dashboard.</p>
//                 </div>
//               </div>

//               <div className="admin-panel__guide-grid">
//                 {guides.map((guide, index) => {
//                   const image = guide?.avatar || guide?.photo || guide?.image;
//                   const imageSrc = image
//                     ? image.startsWith("http")
//                       ? image
//                       : `http://localhost:5000/uploads/${image}`
//                     : "/default_profile.jpg";
//                   const guideSlug = encodeURIComponent(guide?._id || guide?.name || `guide-${index}`);
//                   const guideLocation =
//                     typeof guide?.location === "string"
//                       ? guide.location
//                       : [guide?.location?.city, guide?.location?.state].filter(Boolean).join(", ");

//                   return (
//                     <Link
//                       key={guide._id || guideSlug}
//                       to={`/guide/${guideSlug}`}
//                       className="admin-panel__guide-card"
//                     >
//                       <img src={imageSrc} alt={guide?.name || "guide"} />
//                       <div>
//                         <h3>{guide?.name || "Unnamed guide"}</h3>
//                         <p>{guideLocation || "Location not provided"}</p>
//                         <span>Open Guide Profile</span>
//                       </div>
//                     </Link>
//                   );
//                 })}
//               </div>
//             </section>
//           </>
//         ) : null}
//       </section>
//     </DashboardLayout>
//   );
// }

///////////////////////////////////////////////////////
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import toast from "react-hot-toast";
import DashboardLayout from "../Dashboard/DashboardLayout";
import { loadUser } from "../action/authActions";
import {
  deletePost,
  getAdminBookingStats,
  getAdminUsers,
  getGuides,
  getPosts,
  updateUserBlockStatus,
} from "../services/api";
import "./AdminPanel.css";
import { playNotificationSound } from "../utils/playSound";

// Colors for the charts
const CHART_COLORS = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

const emptyStats = {
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  cancelled: 0,
  tripsDone: 0,
};

// Helper to generate fake weekly trend data so the chart shows something immediately
const generateWeeklyTrend = (totalBookings) => {
  const days = 7;
  const base = Math.max(1, Math.floor(totalBookings / days));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 86400000);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      bookings: Math.max(0, base + Math.floor(Math.random() * 6) - 3),
    };
  });
};

export default function AdminPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading } = useSelector((state) => state.auth);

  const [posts, setPosts] = useState([]);
  const [guides, setGuides] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookingStats, setBookingStats] = useState(emptyStats);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [deletingPostId, setDeletingPostId] = useState("");

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



  // --- NEW: Search state for user table ---
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // --- NEW: Filtered users (instant search) ---
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return users;
    const search = userSearchTerm.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search)
    );
  }, [users, userSearchTerm]);

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
  const isAdmin = role === "admin";

  const blockedUsers = useMemo(
    () => users.filter((item) => item?.isBlocked).length,
    [users]
  );

  // --- CHART DATA DERIVATIONS (Memoized for performance) ---
  const statusDistribution = useMemo(() => {
    return [
      { name: "Pending", value: bookingStats.pending || 0 },
      { name: "Processing", value: bookingStats.processing || 0 },
      { name: "Completed", value: bookingStats.completed || 0 },
      { name: "Cancelled", value: bookingStats.cancelled || 0 },
    ].filter(item => item.value > 0);
  }, [bookingStats]);

  const trendData = useMemo(() => {
    // If your API returns a 'trend' array, use it. Otherwise, generate mock data.
    if (bookingStats.trend) return bookingStats.trend;
    return generateWeeklyTrend(bookingStats.total || 10);
  }, [bookingStats]);

  const guidePostCounts = useMemo(() => {
    const map = new Map();
    posts.forEach(post => {
      const guideName = post?.postedBy?.name || post?.user?.name || "Unknown Guide";
      map.set(guideName, (map.get(guideName) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, posts: count }))
      .sort((a, b) => b.posts - a.posts)
      .slice(0, 5);
  }, [posts]);

  const loadAdminData = async () => {
    if (!isAdmin) return;
    setPageLoading(true);
    setError("");

    try {
      const [postResponse, guideResponse, userResponse, statsResponse] = await Promise.all([
        getPosts(1, 200),
        getGuides(),
        getAdminUsers(),
        getAdminBookingStats(),
      ]);

      setPosts(Array.isArray(postResponse?.posts) ? postResponse.posts : []);
      setGuides(Array.isArray(guideResponse?.guides) ? guideResponse.guides : []);
      setUsers(Array.isArray(userResponse?.users) ? userResponse.users : []);
      setBookingStats(statsResponse?.stats || emptyStats);
    } catch (requestError) {
      setError(requestError?.message || "Unable to load admin dashboard.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadAdminData();
  }, [isAdmin]);

  const handleDeletePost = (postId) => {
    if (!postId || !isAdmin) return;

    triggerConfirmModal(
      "Confirm Post Deletion",
      "Are you sure you want to delete this post from the platform? This action cannot be undone.",
      async () => {
        setDeletingPostId(postId);
        setError("");
        setMessage("");

        try {
          const response = await deletePost(postId);
          if (response?.success || response?.message) {
            setPosts((current) => current.filter((post) => post._id !== postId));
            playNotificationSound("success");
            toast.success("Post deleted successfully!", {
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
            setMessage(response?.message || "Post deleted.");
          } else {
            playNotificationSound("error");
            toast.error("Failed to delete post. Please try again.", {
              duration: 3000,
              style: {
                border: "1.5px solid #ef4444",
                padding: '16px',
                color: '#b91c1c',
                fontWeight: 700,
              },
            });
            setError(response?.message || "Unable to delete post.");
          }
        } catch (requestError) {
          playNotificationSound("error");
          toast.error("Failed to delete post. Please try again.", {
            duration: 3000,
            style: {
              border: "1.5px solid #ef4444",
              padding: '16px',
              color: '#b91c1c',
              fontWeight: 700,
            },
          });
          setError(requestError?.message || "Unable to delete post.");
        } finally {
          setDeletingPostId("");
        }
      }
    );
  };

  const handleToggleBlock = async (targetUser) => {
    if (!targetUser?._id || !isAdmin) return;
    const nextBlocked = !targetUser.isBlocked;
    const reason = nextBlocked ? window.prompt("Reason for suspension", "Bad user behavior") : "";
    if (nextBlocked && reason === null) return;

    setBusyId(targetUser._id);
    setError("");
    setMessage("");

    try {
      const response = await updateUserBlockStatus(targetUser._id, {
        isBlocked: nextBlocked,
        reason,
      });

      setUsers((current) =>
        current.map((item) =>
          item._id === targetUser._id ? { ...item, ...response.user } : item
        )
      );
      setMessage(response?.message || "User updated.");
    } catch (requestError) {
      setError(requestError?.message || "Unable to update user.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <DashboardLayout>
      <section className="admin-panel">
        {/* HERO SECTION */}
        <div className="admin-panel__hero">
          <div>
            <p className="admin-panel__eyebrow">Admin Dashboard</p>
            <h1>Moderation and trip overview</h1>
            <p className="admin-panel__intro">
              Review platform activity, booking progress, and suspend bad users from one place.
            </p>
          </div>
          <div className="admin-panel__meta">
            <span className={`admin-panel__badge ${isAdmin ? "is-admin" : "is-guest"}`}>
              {isAdmin ? "Admin Access" : "No Admin Access"}
            </span>
            <p>{user?.email || "Sign in to continue"}</p>
          </div>
        </div>

        {!loading && user && !isAdmin ? (
          <div className="admin-panel__blocked">
            <h2>Access restricted</h2>
            <p>
              Your account role is <strong>{user.role || "unknown"}</strong>. Only admin accounts
              can open this panel.
            </p>
          </div>
        ) : null}

        {isAdmin ? (
          <>
            {/* STATS CARDS */}
            <div className="admin-panel__stats">
              <article className="admin-panel__stat-card">
                <span className="admin-panel__stat-label">Trips Done</span>
                <strong>{bookingStats.tripsDone}</strong>
                <small>Completed bookings</small>
              </article>
              <article className="admin-panel__stat-card">
                <span className="admin-panel__stat-label">Processing</span>
                <strong>{bookingStats.processing}</strong>
                <small>Confirmed requests</small>
              </article>
              <article className="admin-panel__stat-card">
                <span className="admin-panel__stat-label">Pending</span>
                <strong>{bookingStats.pending}</strong>
                <small>Requests waiting</small>
              </article>
              <article className="admin-panel__stat-card">
                <span className="admin-panel__stat-label">Complete</span>
                <strong>{bookingStats.completed}</strong>
                <small>Finished trips</small>
              </article>
              <article className="admin-panel__stat-card">
                <span className="admin-panel__stat-label">Cancelled</span>
                <strong>{bookingStats.cancelled}</strong>
                <small>Refunded / Cancelled</small>
              </article>
              <article className="admin-panel__stat-card">
                <span className="admin-panel__stat-label">Guides</span>
                <strong>{guides.length}</strong>
                <small>Verified guide profiles</small>
              </article>
              <article className="admin-panel__stat-card">
                <span className="admin-panel__stat-label">Suspended</span>
                <strong>{blockedUsers}</strong>
                <small>Blocked accounts</small>
              </article>
            </div>

            {/* === CHARTS & ANALYTICS ROW === */}
            <div className="admin-panel__analytics">
              <div className="admin-panel__chart-box">
                <h3>📈 Booking Trend (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'white', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="bookings" 
                      stroke="#22c55e" 
                      strokeWidth={3} 
                      dot={{ r: 5, fill: "#22c55e" }}
                      activeDot={{ r: 8 }}
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="admin-panel__chart-box">
                <h3>🧩 Booking Status</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={800}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="admin-panel__chart-box">
                <h3>🏆 Top Guides by Posts</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={guidePostCounts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar 
                      dataKey="posts" 
                      fill="#0a66c2" 
                      radius={[0, 8, 8, 0]} 
                      isAnimationActive={true}
                      animationDuration={900}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ADMIN CONTROLS SECTION */}
            <div className="admin-panel__section-head">
              <div className="admin-panel__section-title">
                <h2>Admin Controls</h2>
                <p>Posts are created by guides only. Admin can moderate posts and users.</p>
              </div>
              <button
                type="button"
                className="admin-panel__secondary-btn"
                onClick={loadAdminData}
                disabled={pageLoading}
              >
                {pageLoading ? "Refreshing..." : "Refresh Dashboard"}
              </button>
            </div>

            {message ? <div className="admin-panel__message is-success">{message}</div> : null}
            {error ? <div className="admin-panel__message is-error">{error}</div> : null}

            {/* ====================================================== */}
            {/* USER SUSPENSION – UPGRADED TABLE WITH SEARCH            */}
            {/* ====================================================== */}
            <section className="admin-panel__card admin-panel__card--table">
              <div className="admin-panel__section-head">
                <div className="admin-panel__section-title">
                  <h2>User Suspension</h2>
                  <p>Block or restore tourists and guides instantly.</p>
                </div>
              </div>

              {/* --- Search + result count --- */}
              <div className="admin-panel__table-toolbar">
                <div className="admin-panel__search-box">
                  <i className="fa fa-search"></i>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                </div>
                <span className="admin-panel__result-count">
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
                </span>
              </div>

              {/* --- Compact Table --- */}
              <div className="admin-panel__table-wrapper">
                <table className="admin-panel__user-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th className="admin-panel__action-col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((item) => (
                      <tr key={item._id}>
                        <td className="admin-panel__user-cell">
                          <strong>{item.name || "Unnamed"}</strong>
                        </td>
                        <td className="admin-panel__email-cell">{item.email}</td>
                        <td>
                          <span className={`admin-panel__role-badge role-${item.role}`}>
                            {item.role || "user"}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-panel__status-badge ${item.isBlocked ? "status-suspended" : "status-active"}`}>
                            {item.isBlocked ? "⛔ Suspended" : "✅ Active"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`admin-panel__action-btn ${item.isBlocked ? "btn-restore" : "btn-suspend"}`}
                            disabled={busyId === item._id || item._id === user?._id}
                            onClick={() => handleToggleBlock(item)}
                          >
                            {busyId === item._id
                              ? "..."
                              : item.isBlocked
                              ? "Restore"
                              : "Suspend"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="5" className="admin-panel__empty-state">
                          No users match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* POST MODERATION */}
            <section className="admin-panel__card">
              <div className="admin-panel__section-head">
                <div className="admin-panel__section-title">
                  <h2>Post Moderation</h2>
                  <p>Remove unsafe or invalid guide posts.</p>
                </div>
              </div>

              <div className="admin-panel__list">
                {posts.map((post) => {
                  const image = post?.photo || post?.image || "/default_profile.jpg";
                  const locationText =
                    typeof post?.location === "string"
                      ? post.location
                      : [post?.location?.city, post?.location?.state].filter(Boolean).join(", ");

                  return (
                    <article key={post._id} className="admin-panel__item">
                      <img src={image} alt={post?.title || "post"} className="admin-panel__item-image" />
                      <div className="admin-panel__item-body">
                        <h3>{post?.title || "Untitled post"}</h3>
                        <p>{post?.body || post?.description || "No description available."}</p>
                        <div className="admin-panel__item-meta">
                          <span>{locationText || "Location not provided"}</span>
                          <span>{post?.price !== undefined ? `Rs. ${post.price}` : "No price"}</span>
                          <span>{post?.likes?.length || 0} likes</span>
                        </div>
                        <div className="admin-panel__item-actions">
                          <button
                            type="button"
                            className="admin-panel__delete-btn"
                            onClick={() => handleDeletePost(post._id)}
                            disabled={deletingPostId === post._id}
                          >
                            {deletingPostId === post._id ? "Deleting..." : "Delete Post"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {!posts.length && !pageLoading ? (
                  <p className="admin-panel__empty">No posts loaded yet.</p>
                ) : null}
              </div>
            </section>

            {/* GUIDE DIRECTORY */}
            <section className="admin-panel__card">
              <div className="admin-panel__section-head">
                <div className="admin-panel__section-title">
                  <h2>Guide Directory</h2>
                  <p>Open guide profiles directly from the admin dashboard.</p>
                </div>
              </div>

              <div className="admin-panel__guide-grid">
                {guides.map((guide, index) => {
                  const image = guide?.avatar || guide?.photo || guide?.image;
                  const imageSrc = image
                    ? image.startsWith("http")
                      ? image
                      : `http://localhost:5000/uploads/${image}`
                    : "/default_profile.jpg";
                  const guideSlug = encodeURIComponent(guide?._id || guide?.name || `guide-${index}`);
                  const guideLocation =
                    typeof guide?.location === "string"
                      ? guide.location
                      : [guide?.location?.city, guide?.location?.state].filter(Boolean).join(", ");

                  return (
                    <Link
                      key={guide._id || guideSlug}
                      to={`/guide/${guideSlug}`}
                      className="admin-panel__guide-card"
                    >
                      <img src={imageSrc} alt={guide?.name || "guide"} />
                      <div>
                        <h3>{guide?.name || "Unnamed guide"}</h3>
                        <p>{guideLocation || "Location not provided"}</p>
                        <span>Open Guide Profile</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}
      </section>

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
    </DashboardLayout>
  );
}