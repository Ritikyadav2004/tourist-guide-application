import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../Dashboard/DashboardLayout";
import { getPackageDetails } from "../../services/api";

const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const CustomPackageSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const packageId = searchParams.get("packageId");
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(Boolean(packageId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!packageId) return;
    let mounted = true;
    const load = async () => {
      try {
        const data = await getPackageDetails(packageId);
        if (mounted) setDetails(data?.package || data);
      } catch (err) {
        if (mounted) setError(err?.message || "Unable to load package details.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [packageId]);

  const assets = details?.selectedAssets || details?.assets || [];

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-[#f8fafc] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
            <i className="fa fa-check" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-green-600">Package locked</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">Your custom trip package is ready</h1>
          <p className="mt-3 text-slate-500">
            Complete the payment to confirm the guide, selected dates, and rented assets.
          </p>

          {loading ? <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-slate-500">Loading package details...</div> : null}
          {error ? <div className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</div> : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Package ID</p>
              <strong className="mt-1 block break-all text-slate-900">{details?._id || packageId || "Pending"}</strong>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Guide</p>
              <strong className="mt-1 block text-slate-900">{details?.guide?.name || details?.guideName || "Assigned guide"}</strong>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Dates</p>
              <strong className="mt-1 block text-slate-900">
                {details?.startDate ? new Date(details.startDate).toLocaleDateString() : "Selected dates"} -{" "}
                {details?.endDate ? new Date(details.endDate).toLocaleDateString() : ""}
              </strong>
            </div>
            <div className="rounded-2xl bg-green-50 p-4">
              <p className="text-xs font-bold uppercase text-green-700">Total amount</p>
              <strong className="mt-1 block text-2xl text-slate-900">{money(details?.totalEstimate || details?.total)}</strong>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">Selected assets</h2>
            <div className="mt-4 grid gap-3">
              {assets.length ? (
                assets.map((item, index) => (
                  <div key={item.assetId || item._id || index} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                    <div>
                      <strong className="text-slate-900">{item.asset?.name || item.name || "Asset"}</strong>
                      <p className="text-sm text-slate-500">Quantity {item.quantity || 1}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700 shadow-sm">
                      {money(item.pricePerDay || item.asset?.pricePerDay)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-slate-500">No extra assets were selected.</p>
              )}
            </div>
          </section>

          <section className="mt-8 rounded-2xl bg-slate-900 p-5 text-white">
            <h2 className="text-xl font-bold text-white">Next steps</h2>
            <p className="mt-2 text-sm text-slate-300">
              Pay the booking amount, watch your dashboard for confirmation, and message the guide for pickup or timing details.
            </p>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="rounded-full bg-green-500 px-6 py-3 font-bold text-white shadow-md transition hover:scale-105"
              onClick={() => navigate("/dashboard/bookings")}
            >
              View Booking
            </button>
            <Link
              to="/dashboard"
              className="rounded-full bg-slate-100 px-6 py-3 text-center font-bold text-slate-800 shadow-sm transition hover:scale-105"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default CustomPackageSuccess;
