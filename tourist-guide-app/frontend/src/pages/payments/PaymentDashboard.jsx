import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from "recharts";
import toast from "react-hot-toast";
import DashboardLayout from "../../Dashboard/DashboardLayout";
import {
  getUserPaymentsAction,
  getGuideEarningsAnalyticsAction,
  getAdminPaymentAnalyticsAction,
  updatePaymentStatusAction,
  clearPaymentError
} from "../../slices/paymentSlice";
import "./PaymentDashboard.css";
import { formatINR, formatINRShort } from "../../utils/formatCurrency";
import { playNotificationSound } from "../../utils/playSound";

const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#6366F1"];

const money = (value) => formatINR(value);

const PaymentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, token } = useSelector((state) => state.auth);
  const { loading, error, userPayments, guideAnalytics, adminAnalytics } = useSelector(
    (state) => state.payment
  );

  const role = (user?.role || "").toLowerCase();

  // Admin filter states
  const [filterTourist, setFilterTourist] = useState("");
  const [filterGuide, setFilterGuide] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Paginations
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Tabs for role-based views
  const [touristTab, setTouristTab] = useState("payments"); // "payments" or "bookings"
  const [guideTab, setGuideTab] = useState("payouts"); // "payouts" or "bookings"
  const [adminTab, setAdminTab] = useState("overview"); // "overview", "analytics", or "transactions"

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchDashboardData();

    return () => {
      dispatch(clearPaymentError());
    };
  }, [dispatch, token, role]);

  const fetchDashboardData = () => {
    if (role === "tourist") {
      dispatch(getUserPaymentsAction());
    } else if (role === "guide") {
      dispatch(getGuideEarningsAnalyticsAction());
    } else if (role === "admin") {
      const filters = {};
      if (filterTourist) filters.touristId = filterTourist;
      if (filterGuide) filters.guideId = filterGuide;
      if (filterStatus) filters.status = filterStatus;
      if (filterStartDate) filters.startDate = filterStartDate;
      if (filterEndDate) filters.endDate = filterEndDate;
      dispatch(getAdminPaymentAnalyticsAction(filters));
    }
  };

  const handleApplyAdminFilters = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDashboardData();
  };

  const handleClearAdminFilters = () => {
    setFilterTourist("");
    setFilterGuide("");
    setFilterStatus("");
    setFilterStartDate("");
    setFilterEndDate("");
    setCurrentPage(1);
    // Directly dispatch with empty filters
    dispatch(getAdminPaymentAnalyticsAction({}));
  };



  // Modal Dialog and Status update Confirmation states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState({ paymentId: "", newStatus: "" });

  const handleUpdateStatusTrigger = (paymentId, newStatus) => {
    if (!paymentId || !newStatus) return;
    setConfirmData({ paymentId, newStatus });
    setShowConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmData({ paymentId: "", newStatus: "" });
  };

  const handleProceedUpdateStatus = async () => {
    const { paymentId, newStatus } = confirmData;
    handleCloseConfirmModal();

    try {
      await dispatch(updatePaymentStatusAction({ paymentId, status: newStatus })).unwrap();
      
      // Trigger notification sound
      if (newStatus === "pending") {
        playNotificationSound("processing");
      } else if (newStatus === "failed" || newStatus === "refunded") {
        playNotificationSound("error");
      } else {
        playNotificationSound("success");
      }
      
      // Determine toast style & color
      let toastColor = "#10b981"; // default green for Successful
      if (newStatus === "pending") toastColor = "#f59e0b"; // orange
      else if (newStatus === "refunded") toastColor = "#8b5cf6"; // purple
      else if (newStatus === "failed") toastColor = "#ef4444"; // red
      
      toast.success(`Payment status updated to ${newStatus}`, {
        duration: 3000,
        style: {
          border: `1.5px solid ${toastColor}`,
          padding: '16px',
          color: '#0f172a',
          fontWeight: 700,
        },
        iconTheme: {
          primary: toastColor,
          secondary: '#fff',
        },
      });

      fetchDashboardData();
    } catch (err) {
      // Play error sound fallback
      playNotificationSound("error");

      toast.error(`Failed to update payment status. Please try again.`, {
        duration: 3000,
        style: {
          border: `1.5px solid #ef4444`,
          padding: '16px',
          color: '#b91c1c',
          fontWeight: 700,
        },
      });
    }
  };

  // Escape key listener for closing modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCloseConfirmModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Helper to format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // ============================================
  // RENDER TOURIST DASHBOARD
  // ============================================
  const renderTouristDashboard = () => {
    if (!userPayments) return <div className="payment-empty">No payments data available.</div>;

    const { stats, history, bookingsHistory, charts } = userPayments;

    // Client-side pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPayments = (history || []).slice(startIndex, startIndex + itemsPerPage);
    const paginatedBookings = (bookingsHistory || []).slice(startIndex, startIndex + itemsPerPage);

    const activeList = touristTab === "payments" ? (history || []) : (bookingsHistory || []);
    const totalPages = Math.ceil(activeList.length / itemsPerPage);

    return (
      <div className="p-dashboard-layout">
        {/* Hero Title */}
        <div className="p-dashboard-header">
          <div>
            <h1>My Payments Dashboard</h1>
            <p>Track your trip purchases, deposits, and refunds securely.</p>
          </div>
          <div className="user-profile-badge">
            <span className="role-tag tourist">Tourist</span>
            <span>{user?.name}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-stats-grid">
          <div className="p-stat-card">
            <div className="p-stat-icon info">📅</div>
            <div>
              <span className="p-stat-label">Total Bookings</span>
              <strong className="p-stat-value">{stats?.totalBookings || 0}</strong>
            </div>
          </div>
          <div className="p-stat-card">
            <div className="p-stat-icon success">💳</div>
            <div>
              <span className="p-stat-label">Total Payments Made</span>
              <strong className="p-stat-value">{money(stats?.totalPaymentsMade)}</strong>
            </div>
          </div>
          <div className="p-stat-card">
            <div className="p-stat-icon completed">✓</div>
            <div>
              <span className="p-stat-label">Successful Payments</span>
              <strong className="p-stat-value">{stats?.successfulCount || 0}</strong>
            </div>
          </div>
          <div className="p-stat-card">
            <div className="p-stat-icon pending">⏳</div>
            <div>
              <span className="p-stat-label">Pending Payments</span>
              <strong className="p-stat-value">{stats?.pendingCount || 0}</strong>
            </div>
          </div>
          <div className="p-stat-card">
            <div className="p-stat-icon failed">🗙</div>
            <div>
              <span className="p-stat-label">Failed Payments</span>
              <strong className="p-stat-value">{stats?.failedCount || 0}</strong>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="p-charts-grid">
          {/* Status Distribution Pie */}
          <div className="p-chart-card">
            <h3>Payment Status Distribution</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={(charts?.paymentStatusDistribution || []).filter(c => c.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(charts?.paymentStatusDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Transactions`, "Count"]} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
              {!(charts?.paymentStatusDistribution || []).some(c => c.value > 0) && (
                <div className="chart-no-data">No Transactions Found</div>
              )}
            </div>
          </div>

          {/* Monthly Payments Bar */}
          <div className="p-chart-card">
            <h3>Monthly Expenditures</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={charts?.monthlyPayments || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(value) => [money(value), "Amount Spent"]} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Booking vs Payment Trend Line */}
          <div className="p-chart-card full-width">
            <h3>Booking Activity vs Payment Trend</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={charts?.bookingVsPaymentTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId={0}
                    type="monotone"
                    dataKey="bookings"
                    name="Bookings Formed"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId={0}
                    type="monotone"
                    dataKey="payments"
                    name="Payments Settled (₹)"
                    stroke="#10b981"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Transaction / Bookings Table */}
        <div className="p-table-card">
          <div className="p-tabs-header">
            <button
              className={`p-tab-btn ${touristTab === "payments" ? "active" : ""}`}
              onClick={() => { setTouristTab("payments"); setCurrentPage(1); }}
            >
              💳 Personal Payment History
            </button>
            <button
              className={`p-tab-btn ${touristTab === "bookings" ? "active" : ""}`}
              onClick={() => { setTouristTab("bookings"); setCurrentPage(1); }}
            >
              📅 Personal Booking History
            </button>
          </div>

          {touristTab === "payments" ? (
            <div className="p-table-wrapper">
              <table className="p-data-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Trip / Tour</th>
                    <th>Local Guide</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.length > 0 ? (
                    paginatedPayments.map((p) => (
                      <tr key={p._id}>
                        <td className="font-mono text-xs text-slate-500">
                          {p.transactionId ? `#${p.transactionId.toUpperCase()}` : "N/A"}
                        </td>
                        <td className="font-semibold text-slate-800">{p.tourTitle}</td>
                        <td>{p.guideName}</td>
                        <td className="font-bold text-slate-900">{money(p.amount)}</td>
                        <td>
                          <span className={`type-badge ${p.type}`}>{p.type}</span>
                        </td>
                        <td>{p.paymentMethod ? p.paymentMethod.toUpperCase() : "N/A"}</td>
                        <td>
                          <span className={`status-badge ${p.paymentStatus}`}>
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="text-slate-500 text-xs">{formatDate(p.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-table-empty">
                        No payments made yet. Go book a tour!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-table-wrapper">
              <table className="p-data-table">
                <thead>
                  <tr>
                    <th>Booking Reference</th>
                    <th>Trip / Tour</th>
                    <th>Local Guide</th>
                    <th>Total Price</th>
                    <th>Trip Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Booked At</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.length > 0 ? (
                    paginatedBookings.map((b) => (
                      <tr key={b._id}>
                        <td className="font-mono text-xs text-indigo-600 font-bold">
                          #{b._id.toString().slice(-8).toUpperCase()}
                        </td>
                        <td className="font-semibold text-slate-800">{b.tourTitle}</td>
                        <td>{b.guideName}</td>
                        <td className="font-bold text-slate-900">{money(b.totalPrice)}</td>
                        <td>
                          <span className={`status-badge ${b.status}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="text-slate-500 text-xs">{formatDate(b.startDate).split(",")[0]}</td>
                        <td className="text-slate-500 text-xs">{formatDate(b.endDate).split(",")[0]}</td>
                        <td className="text-slate-500 text-xs">{formatDate(b.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-table-empty">
                        No bookings formed yet. Go select a tour package!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="table-pagination">
              <span>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <div className="pagination-buttons">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ← Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER GUIDE DASHBOARD
  // ============================================
  const renderGuideDashboard = () => {
    if (!guideAnalytics) return <div className="payment-empty">No earnings analytics available.</div>;

    const { stats, payments, bookingsHistory, charts } = guideAnalytics;

    // Client-side pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPayments = (payments || []).slice(startIndex, startIndex + itemsPerPage);
    const paginatedBookings = (bookingsHistory || []).slice(startIndex, startIndex + itemsPerPage);

    const activeList = guideTab === "payouts" ? (payments || []) : (bookingsHistory || []);
    const totalPages = Math.ceil(activeList.length / itemsPerPage);

    return (
      <div className="p-dashboard-layout">
        {/* Hero Title */}
        <div className="p-dashboard-header">
          <div>
            <h1>My Earnings Center</h1>
            <p>Track your payouts, pending balances, and monthly revenue performance.</p>
          </div>
          <div className="user-profile-badge">
            <span className="role-tag guide">Guide</span>
            <span>{user?.name}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-stats-grid">
          <div className="p-stat-card">
            <div className="p-stat-icon info">📅</div>
            <div>
              <span className="p-stat-label">Total Bookings Received</span>
              <strong className="p-stat-value">{stats?.totalBookingsReceived || 0}</strong>
            </div>
          </div>
          <div className="p-stat-card">
            <div className="p-stat-icon success">🪙</div>
            <div>
              <span className="p-stat-label">Earnings From Own Bookings</span>
              <strong className="p-stat-value">{money(stats?.earningsFromOwnBookings)}</strong>
            </div>
          </div>
          <div className="p-stat-card">
            <div className="p-stat-icon pending">⏳</div>
            <div>
              <span className="p-stat-label">Pending Earnings</span>
              <strong className="p-stat-value">{money(stats?.pendingEarnings)}</strong>
            </div>
          </div>
          <div className="p-stat-card">
            <div className="p-stat-icon completed">✓</div>
            <div>
              <span className="p-stat-label">Successful Payments</span>
              <strong className="p-stat-value">{stats?.successfulPayments || 0}</strong>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="p-charts-grid">
          {/* Monthly Earnings Bar */}
          <div className="p-chart-card">
            <h3>Monthly Earnings Trend</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={charts?.monthlyEarnings || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(value) => [money(value), "Monthly Earnings"]} />
                  <Bar dataKey="earnings" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Booking Status Pie */}
          <div className="p-chart-card">
            <h3>Booking Status Summary</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={(charts?.bookingStatusOverview || []).filter(c => c.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(charts?.bookingStatusOverview || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Bookings`, "Count"]} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
              {!(charts?.bookingStatusOverview || []).some(c => c.value > 0) && (
                <div className="chart-no-data">No Bookings Found</div>
              )}
            </div>
          </div>

          {/* Revenue cumulative trend Line */}
          <div className="p-chart-card full-width">
            <h3>Cumulative Revenue Growth</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={charts?.revenueTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(value) => [money(value), "Cumulative Earnings"]} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Earnings Accumulation"
                    stroke="#10b981"
                    strokeWidth={4}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="p-table-card">
          <div className="p-tabs-header">
            <button
              className={`p-tab-btn ${guideTab === "payouts" ? "active" : ""}`}
              onClick={() => { setGuideTab("payouts"); setCurrentPage(1); }}
            >
              🪙 Booking Payout Log
            </button>
            <button
              className={`p-tab-btn ${guideTab === "bookings" ? "active" : ""}`}
              onClick={() => { setGuideTab("bookings"); setCurrentPage(1); }}
            >
              📅 Received Bookings List
            </button>
          </div>

          {guideTab === "payouts" ? (
            <div className="p-table-wrapper">
              <table className="p-data-table">
                <thead>
                  <tr>
                    <th>Booking Reference</th>
                    <th>Tourist</th>
                    <th>Payout Amount</th>
                    <th>Type</th>
                    <th>Payment Status</th>
                    <th>Settle Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.length > 0 ? (
                    paginatedPayments.map((p) => (
                      <tr key={p._id}>
                        <td className="font-mono text-xs text-indigo-600 font-bold">
                          {p.transactionId ? `#${p.transactionId.toUpperCase()}` : `#${p._id.toString().slice(-10).toUpperCase()}`}
                        </td>
                        <td className="font-semibold text-slate-800">{p.touristName}</td>
                        <td className="font-bold text-slate-900">{money(p.amount)}</td>
                        <td>
                          <span className={`type-badge ${p.type}`}>{p.type}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${p.paymentStatus}`}>
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="text-slate-500 text-xs">{formatDate(p.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-table-empty">
                        No earnings records located. Confirm bookings to generate payout logs!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-table-wrapper">
              <table className="p-data-table">
                <thead>
                  <tr>
                    <th>Booking Reference</th>
                    <th>Tourist Name</th>
                    <th>Trip / Tour</th>
                    <th>Total Price</th>
                    <th>Trip Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Booked At</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.length > 0 ? (
                    paginatedBookings.map((b) => (
                      <tr key={b._id}>
                        <td className="font-mono text-xs text-indigo-600 font-bold">
                          #{b._id.toString().slice(-8).toUpperCase()}
                        </td>
                        <td className="font-semibold text-slate-800">{b.touristName}</td>
                        <td className="font-semibold text-slate-800">{b.tourTitle}</td>
                        <td className="font-bold text-slate-900">{money(b.totalPrice)}</td>
                        <td>
                          <span className={`status-badge ${b.status}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="text-slate-500 text-xs">{formatDate(b.startDate).split(",")[0]}</td>
                        <td className="text-slate-500 text-xs">{formatDate(b.endDate).split(",")[0]}</td>
                        <td className="text-slate-500 text-xs">{formatDate(b.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-table-empty">
                        No bookings received yet. Keep sharing your post links!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="table-pagination">
              <span>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <div className="pagination-buttons">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ← Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER ADMIN DASHBOARD
  // ============================================
  const renderAdminDashboard = () => {
    if (!adminAnalytics) return <div className="payment-empty">No admin analytics loaded.</div>;

    const { stats, payments, filterOptions, charts } = adminAnalytics;

    // Client-side pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPayments = (payments || []).slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil((payments || []).length / itemsPerPage);

    return (
      <div className="p-dashboard-layout">
        {/* Header */}
        <div className="p-dashboard-header">
          <div>
            <h1>Admin Payment Management</h1>
            <p>Analyze platform-wide revenue growth, audit transaction history, and configure payment records.</p>
          </div>
          <div className="user-profile-badge">
            <span className="role-tag admin">Administrator</span>
            <span>{user?.name}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="p-tabs-header admin-tabs">
          <button
            className={`p-tab-btn ${adminTab === "overview" ? "active" : ""}`}
            onClick={() => setAdminTab("overview")}
          >
            📊 Overview
          </button>
          <button
            className={`p-tab-btn ${adminTab === "analytics" ? "active" : ""}`}
            onClick={() => setAdminTab("analytics")}
          >
            📈 Analytics
          </button>
          <button
            className={`p-tab-btn ${adminTab === "transactions" ? "active" : ""}`}
            onClick={() => setAdminTab("transactions")}
          >
            💸 Transactions
          </button>
        </div>

        {/* TAB 1 — Overview */}
        {adminTab === "overview" && (
          <>
            {/* Stats Grid */}
            <div className="p-stats-grid admin">
              <div className="p-stat-card">
                <div className="p-stat-icon success">💳</div>
                <div>
                  <span className="p-stat-label">Total Revenue</span>
                  <strong className="p-stat-value">{money(stats?.totalRevenue)}</strong>
                </div>
              </div>
              <div className="p-stat-card">
                <div className="p-stat-icon completed">✓</div>
                <div>
                  <span className="p-stat-label">Successful Payments</span>
                  <strong className="p-stat-value">{stats?.totalSuccessfulPayments}</strong>
                </div>
              </div>
              <div className="p-stat-card">
                <div className="p-stat-icon pending">⏳</div>
                <div>
                  <span className="p-stat-label">Pending Payments</span>
                  <strong className="p-stat-value">{stats?.totalPendingPayments}</strong>
                </div>
              </div>
              <div className="p-stat-card">
                <div className="p-stat-icon failed">🗙</div>
                <div>
                  <span className="p-stat-label">Failed Requests</span>
                  <strong className="p-stat-value">{stats?.totalFailedPayments}</strong>
                </div>
              </div>
              <div className="p-stat-card">
                <div className="p-stat-icon refund">↩</div>
                <div>
                  <span className="p-stat-label">Refunds Paid</span>
                  <strong className="p-stat-value">{money(stats?.totalRefundsAmount)}</strong>
                  <small className="refund-subtext">{stats?.totalRefunds || 0} Refunds</small>
                </div>
              </div>
            </div>

            {/* Overview Charts Grid */}
            <div className="p-charts-grid admin">
              {/* Revenue Analytics (Growth Line Chart) */}
              <div className="p-chart-card">
                <h3>Revenue Analytics (Monthly)</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={charts?.revenueAnalytics || []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => formatINRShort(v)} />
                      <Tooltip formatter={(value) => [formatINR(value), "Settled Payments"]} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Status Distribution Pie */}
              <div className="p-chart-card">
                <h3>Payment Status Distribution</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={(charts?.paymentStatusDistribution || []).filter(c => c.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {(charts?.paymentStatusDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Transactions`, "Count"]} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                  {!(charts?.paymentStatusDistribution || []).some(c => c.value > 0) && (
                    <div className="chart-no-data">No Transactions Registered</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2 — Analytics */}
        {adminTab === "analytics" && (
          <div className="p-charts-grid admin">
            {/* Top Earning Guides Bar */}
            <div className="p-chart-card">
              <h3>Top Earning Guides</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={charts?.topEarningGuides || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => formatINRShort(v)} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                    <Tooltip formatter={(value) => [formatINR(value), "Earnings"]} />
                    <Bar dataKey="earnings" fill="#ec4899" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {!(charts?.topEarningGuides || []).length && (
                  <div className="chart-no-data">No Settled Guide Earnings</div>
                )}
              </div>
            </div>

            {/* Booking vs Revenue Trends Line */}
            <div className="p-chart-card">
              <h3>Platform Bookings Count vs Revenue Trends</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={charts?.bookingVsRevenueTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" fontSize={11} tickFormatter={(v) => formatINRShort(v)} />
                    <YAxis yAxisId="right" orientation="right" stroke="#a855f7" fontSize={11} allowDecimals={false} domain={[0, 'auto']} />
                    <Tooltip formatter={(value, name) => {
                      if (name === "Revenue Earned (₹)" || name === "revenue") {
                        return [formatINR(value), "Revenue Earned"];
                      }
                      return [value, name];
                    }} />
                    <Legend />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bookings"
                      name="Bookings Formed"
                      stroke="#a855f7"
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue Earned (₹)"
                      stroke="#3b82f6"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3 — Transactions */}
        {adminTab === "transactions" && (
          <>
            {/* Filters Form */}
            <div className="admin-filters-card">
              <h3>Advanced Payments Filter</h3>
              <form className="filters-form" onSubmit={handleApplyAdminFilters}>
                <div className="filter-input-group">
                  <label>Tourist</label>
                  <select value={filterTourist} onChange={(e) => setFilterTourist(e.target.value)}>
                    <option value="">All Tourists</option>
                    {(filterOptions?.tourists || []).map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-input-group">
                  <label>Guide</label>
                  <select value={filterGuide} onChange={(e) => setFilterGuide(e.target.value)}>
                    <option value="">All Guides</option>
                    {(filterOptions?.guides || []).map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-input-group">
                  <label>Payment Status</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="successful">Successful</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div className="filter-input-group">
                  <label>Start Date</label>
                  <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                </div>

                <div className="filter-input-group">
                  <label>End Date</label>
                  <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                </div>

                <div className="filter-buttons">
                  <button type="submit" className="btn-filter-apply">Apply Filters</button>
                  <button type="button" className="btn-filter-clear" onClick={handleClearAdminFilters}>Clear All</button>
                </div>
              </form>
            </div>

            {/* Platform Payments Table */}
            <div className="p-table-card">
              <h2>All Platform Transactions</h2>
              <div className="p-table-wrapper">
                <table className="p-data-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Tourist Details</th>
                      <th>Local Guide</th>
                      <th>Tour Details</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.length > 0 ? (
                      paginatedPayments.map((p) => (
                        <tr key={p._id}>
                          <td className="font-mono text-xs">
                            {p.transactionId ? `#${p.transactionId.toUpperCase()}` : "N/A"}
                          </td>
                          <td>
                            <div className="font-semibold text-slate-800">{p.touristName}</div>
                            <div className="text-slate-400 text-xs">{p.touristEmail}</div>
                          </td>
                          <td>{p.guideName}</td>
                          <td>{p.tourTitle}</td>
                          <td className="font-bold text-slate-900">{money(p.amount)}</td>
                          <td>
                            <span className={`type-badge ${p.type}`}>{p.type}</span>
                          </td>
                          <td className="text-slate-500 text-xs">{formatDate(p.createdAt)}</td>
                          <td>
                            <span className={`status-badge ${p.paymentStatus}`}>
                              {p.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <select
                              className="status-selector"
                              value={p.paymentStatus}
                              onChange={(e) => handleUpdateStatusTrigger(p._id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="successful">Successful</option>
                              <option value="failed">Failed</option>
                              <option value="refunded">Refunded</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="p-table-empty">
                          No payments found matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              {totalPages > 1 && (
                <div className="table-pagination">
                  <span>
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                  </span>
                  <div className="pagination-buttons">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      ← Previous
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // ============================================
  // MAIN DASHBOARD COMPONENT RENDER
  // ============================================
  const renderDashboardByRole = () => {
    switch (role) {
      case "tourist":
        return renderTouristDashboard();
      case "guide":
        return renderGuideDashboard();
      case "admin":
        return renderAdminDashboard();
      default:
        return (
          <div className="payment-empty">
            <h2>Access Restricted</h2>
            <p>Please log in with a valid account to view your payment dashboard.</p>
            <Link to="/login" className="login-prompt-btn">Login Now</Link>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <section className="payment-dashboard-container">
        {error && (
          <div className="payment-error-banner">
            <span>⚠️</span>
            <p>{error}</p>
            <button className="error-close-btn" onClick={() => dispatch(clearPaymentError())}>×</button>
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading-spinner">
            <div className="spinner"></div>
            <p>Loading analytics data, please wait...</p>
          </div>
        ) : (
          <>
            {renderDashboardByRole()}

            {/* Admin status change confirmation modal */}
            {showConfirmModal && (
              <div className="p-modal-backdrop" onClick={handleCloseConfirmModal}>
                <div className="p-confirm-modal" onClick={(e) => e.stopPropagation()}>
                  <h2>Confirm Status Change</h2>
                  <p>
                    Are you sure you want to mark this payment as <strong>{confirmData.newStatus}</strong>? This action may notify the tourist and cannot be easily undone.
                  </p>
                  <div className="p-modal-buttons">
                    <button className="btn-modal-cancel" onClick={handleCloseConfirmModal}>Cancel</button>
                    <button className="btn-modal-confirm" onClick={handleProceedUpdateStatus}>Confirm</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </DashboardLayout>
  );
};

export default PaymentDashboard;
