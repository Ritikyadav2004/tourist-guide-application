import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../Dashboard/DashboardLayout";
import { getGuideEarningsAction, clearGuideError } from "../../action/guideActions";

const GuideRevenue = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useSelector((state) => state.auth);
  const { loading, earnings, error } = useSelector((state) => state.guide);

  const isGuide = (user?.role || "").toLowerCase() === "guide";

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

  // Access restricted for non-guides
  if (!authLoading && user && !isGuide) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">Access Restricted</h2>
          <p className="mt-2 text-slate-600">This page is only available for verified guides.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section className="space-y-6 p-4 sm:p-6">
        {/* HERO */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              📊 Guide Dashboard
            </p>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              My Revenue & Earnings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track your total earnings, pending payouts, and trip history.
            </p>
          </div>
          <button
            className="rounded-full bg-slate-800 px-5 py-2.5 font-bold text-white shadow-md transition hover:scale-105 hover:bg-slate-900 disabled:opacity-50"
            onClick={() => dispatch(getGuideEarningsAction())}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl bg-red-50 p-4 font-semibold text-red-700 ring-1 ring-red-100">
            {error}
          </div>
        )}

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <span className="text-sm font-medium text-slate-500">Total Earned</span>
            <strong className="mt-1 block text-3xl font-black text-slate-900">
              ₹{earnings?.totalEarned?.toLocaleString() || 0}
            </strong>
            <small className="text-xs text-slate-400">Lifetime earnings</small>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <span className="text-sm font-medium text-slate-500">Pending Payout</span>
            <strong className="mt-1 block text-3xl font-black text-slate-900">
              ₹{earnings?.pendingPayout?.toLocaleString() || 0}
            </strong>
            <small className="text-xs text-slate-400">Awaiting transfer</small>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <span className="text-sm font-medium text-slate-500">Completed Trips</span>
            <strong className="mt-1 block text-3xl font-black text-slate-900">
              {earnings?.completedTrips || 0}
            </strong>
            <small className="text-xs text-slate-400">Finished bookings</small>
          </div>
        </div>

        {/* OPTIONAL: Deposit vs Final breakdown (extra insight) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <span className="text-sm font-medium text-slate-500">Deposits Collected</span>
            <strong className="mt-1 block text-2xl font-black text-slate-900">
              ₹{earnings?.depositTotal?.toLocaleString() || 0}
            </strong>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <span className="text-sm font-medium text-slate-500">Final Payments</span>
            <strong className="mt-1 block text-2xl font-black text-slate-900">
              ₹{earnings?.finalTotal?.toLocaleString() || 0}
            </strong>
          </div>
        </div>

        {/* TRANSACTION HISTORY */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="text-xl font-bold text-slate-900">Recent Transactions</h3>
          {loading ? (
            <p className="mt-4 text-slate-500">Loading transactions...</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Tourist</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {earnings?.recentBookings?.length > 0 ? (
                    earnings.recentBookings.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {item.tourist || "Guest"}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          ₹{item.amount}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-bold capitalize ${
                              (item.status || "completed") === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.status || "Completed"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                        No transactions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
};

export default GuideRevenue;