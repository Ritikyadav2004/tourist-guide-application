import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../../Dashboard/DashboardLayout";
import {
  getGuideEarningsAction,
  getGuideBookingEarningsAction,
  clearGuideError,
} from "../../slices/earningsSlice";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const GuideRevenue = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useSelector((state) => state.auth);
  const { loading, earnings, bookingEarnings, error } = useSelector((state) => state.guide);

  const [activeTab, setActiveTab] = useState("overview"); // overview or detailed
  const [currentPage, setCurrentPage] = useState(1);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const isGuide = (user?.role || "").toLowerCase() === "guide";

  // Load overview stats on mount
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (isGuide) {
      dispatch(getGuideEarningsAction());
    }
    return () => {
      dispatch(clearGuideError());
    };
  }, [dispatch, token, isGuide, navigate]);

  // Load paginated booking earnings when switching tab or changing page
  useEffect(() => {
    if (isGuide && activeTab === "detailed") {
      dispatch(getGuideBookingEarningsAction({ page: currentPage, limit: 10 }));
    }
  }, [dispatch, isGuide, activeTab, currentPage]);

  // Client-side date filtering over current page's bookings
  const filteredBookings = useMemo(() => {
    if (!bookingEarnings?.bookings) return [];
    return bookingEarnings.bookings.filter((b) => {
      // Use trip startDate as the benchmark, fallback to booking creation date
      const benchmarkDate = new Date(b.startDate || b.createdAt);
      if (startDateFilter) {
        const startLimit = new Date(`${startDateFilter}T00:00:00`);
        if (benchmarkDate < startLimit) return false;
      }
      if (endDateFilter) {
        const endLimit = new Date(`${endDateFilter}T23:59:59`);
        if (benchmarkDate > endLimit) return false;
      }
      return true;
    });
  }, [bookingEarnings?.bookings, startDateFilter, endDateFilter]);

  const handleClearFilters = () => {
    setStartDateFilter("");
    setEndDateFilter("");
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (bookingEarnings?.pagination?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  // Access restricted for non-guides
  if (!authLoading && user && !isGuide) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm">
          <div className="text-5xl text-red-500 mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-slate-800">Access Restricted</h2>
          <p className="mt-2 text-slate-600">This page is only available for verified guides.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section className="space-y-6 p-4 sm:p-6 bg-[#f8fafc] min-h-screen">
        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"></div>
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-3 py-1 text-xs font-semibold tracking-wider text-emerald-300">
                💰 Guide Center
              </span>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                My Earnings Dashboard
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-300 leading-relaxed">
                Track your financial stats, view detailed payouts, and filter completed tour bookings.
              </p>
            </div>
            <button
              className="group flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-bold text-white shadow-sm ring-1 ring-white/25 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:text-slate-900"
              onClick={() => {
                dispatch(getGuideEarningsAction());
                if (activeTab === "detailed") {
                  dispatch(getGuideBookingEarningsAction({ page: currentPage, limit: 10 }));
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></span>
              ) : (
                <span className="transition-transform group-hover:rotate-180 duration-500">↻</span>
              )}
              Refresh Balance
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-slate-200">
          <button
            className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === "detailed"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
            onClick={() => {
              setActiveTab("detailed");
              setCurrentPage(1);
            }}
          >
            Detailed Payout Breakdown
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl bg-red-50 p-4 border border-red-100 font-semibold text-red-700 flex items-center gap-3">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* STATS SUMMARY CARDS */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {/* Total Earned */}
              <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md">
                <div className="absolute right-4 top-4 text-3xl text-emerald-500 opacity-20 transition-transform group-hover:scale-110">💵</div>
                <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Total Earned</span>
                <strong className="mt-2 block text-3xl font-black text-slate-900">
                  {loading && !earnings ? "Loading..." : money(earnings?.totalEarned)}
                </strong>
                <small className="mt-1 block text-xs text-slate-400">Lifetime completed trip payouts</small>
              </div>

              {/* Pending Payout */}
              <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md">
                <div className="absolute right-4 top-4 text-3xl text-amber-500 opacity-20 transition-transform group-hover:scale-110">⏳</div>
                <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Pending Payout</span>
                <strong className="mt-2 block text-3xl font-black text-slate-900">
                  {loading && !earnings ? "Loading..." : money(earnings?.pendingPayout)}
                </strong>
                <small className="mt-1 block text-xs text-slate-400">Escrowed from pending/confirmed bookings</small>
              </div>

              {/* Completed Trips */}
              <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md">
                <div className="absolute right-4 top-4 text-3xl text-indigo-500 opacity-20 transition-transform group-hover:scale-110">🗺️</div>
                <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Completed Trips</span>
                <strong className="mt-2 block text-3xl font-black text-slate-900">
                  {loading && !earnings ? "Loading..." : earnings?.completedTrips || 0}
                </strong>
                <small className="mt-1 block text-xs text-slate-400">Successfully concluded tours</small>
              </div>
            </div>

            {/* PAYMENT TYPES BREAKDOWN */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-400 uppercase">Deposits Collected (20%)</span>
                  <strong className="mt-1 block text-2xl font-black text-slate-900">
                    {loading && !earnings ? "..." : money(earnings?.depositTotal)}
                  </strong>
                </div>
                <span className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold">🛡️</span>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-400 uppercase">Final Settlements (80%)</span>
                  <strong className="mt-1 block text-2xl font-black text-slate-900">
                    {loading && !earnings ? "..." : money(earnings?.finalTotal)}
                  </strong>
                </div>
                <span className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-bold">🤝</span>
              </div>
            </div>

            {/* RECENT TRANSACTIONS TABLE */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Recent Completed Payouts</h3>
                <button
                  onClick={() => setActiveTab("detailed")}
                  className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition"
                >
                  View All Transactions →
                </button>
              </div>

              {loading && !earnings ? (
                <div className="space-y-3 py-4">
                  <div className="h-5 bg-slate-100 rounded animate-pulse w-full"></div>
                  <div className="h-5 bg-slate-100 rounded animate-pulse w-full"></div>
                  <div className="h-5 bg-slate-100 rounded animate-pulse w-full"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 px-3">Tourist</th>
                        <th className="pb-3 px-3">Date</th>
                        <th className="pb-3 px-3">Tour Details</th>
                        <th className="pb-3 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {earnings?.recentBookings?.length > 0 ? (
                        earnings.recentBookings.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-semibold text-slate-700">
                              <div>{item.tourist || "Guest"}</div>
                              <div className="text-xs text-slate-400">{item.touristEmail}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-500">
                              {new Date(item.date).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mr-2">
                                {item.status}
                              </span>
                              {item.startDate ? (
                                <span className="text-xs text-slate-400">
                                  {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                                </span>
                              ) : "Custom Tour"}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-slate-900">
                              {money(item.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-400 font-semibold">
                            No transactions completed yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED BREAKDOWN */}
        {activeTab === "detailed" && (
          <div className="space-y-6">
            {/* FILTERS */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">📅 Date Range Filters (Trip Start Date)</h4>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="grid gap-1 text-sm font-bold text-slate-700 flex-1">
                  <span>Start Date</span>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid gap-1 text-sm font-bold text-slate-700 flex-1">
                  <span>End Date</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearFilters}
                    disabled={!startDateFilter && !endDateFilter}
                    className="rounded-2xl bg-slate-100 hover:bg-slate-250 border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* TRANSACTIONS BREAKDOWN TABLE */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">Per-Booking Earnings Log</h3>
                <p className="text-xs text-slate-400">Full audit log of confirmed and completed trips and payouts.</p>
              </div>

              {loading ? (
                <div className="space-y-4 py-6">
                  <div className="h-6 bg-slate-100 rounded animate-pulse w-full"></div>
                  <div className="h-6 bg-slate-100 rounded animate-pulse w-full"></div>
                  <div className="h-6 bg-slate-100 rounded animate-pulse w-full"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 px-3">Booking ID</th>
                        <th className="pb-3 px-3">Tourist Details</th>
                        <th className="pb-3 px-3">Tour Topic</th>
                        <th className="pb-3 px-3">Trip Timeline</th>
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((b) => (
                          <tr key={b.id || b._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 text-xs font-mono font-bold text-indigo-600">
                              <Link to={`/dashboard/bookings`} className="hover:underline">
                                #{String(b.id || b._id).slice(-6).toUpperCase()}
                              </Link>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800">{b.tourist}</div>
                              <div className="text-xs text-slate-400">{b.touristEmail}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-700 font-medium">
                              {b.postTitle || "Custom Guided Tour"}
                            </td>
                            <td className="py-3 px-3 text-xs text-slate-500">
                              <div>
                                {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Booked: {new Date(b.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                                  b.status === "completed"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-indigo-50 text-indigo-700"
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-black text-slate-900">
                              {money(b.totalPrice)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">
                            {bookingEarnings?.bookings?.length === 0
                              ? "No bookings found."
                              : "No transactions match your date filters."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PAGINATION CONTROLS */}
              {bookingEarnings?.pagination && bookingEarnings.pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-500">
                    Showing Page <strong>{bookingEarnings.pagination.currentPage}</strong> of <strong>{bookingEarnings.pagination.totalPages}</strong> ({bookingEarnings.pagination.totalItems} bookings)
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-40 transition cursor-pointer"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1 || loading}
                    >
                      ← Prev
                    </button>
                    <button
                      className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-40 transition cursor-pointer"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= bookingEarnings.pagination.totalPages || loading}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default GuideRevenue;