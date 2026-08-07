import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PriceBreakdown from "./PriceBreakdown";

const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const PackageSummary = ({
  selectedAssets = [],
  days,
  people,
  guidePrice,
  estimate,
  onEstimate,
  onSave,
  estimating,
  saving,
}) => {
  const [remaining, setRemaining] = useState(3600);

  useEffect(() => {
    const expiresAt = estimate?.expiresAt ? new Date(estimate.expiresAt).getTime() : Date.now() + 3600 * 1000;
    const update = () => setRemaining(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [estimate?.expiresAt]);

  const liveTotals = useMemo(() => {
    const assetTotal = selectedAssets.reduce(
      (sum, item) => sum + Number(item.pricePerDay || 0) * Number(item.quantity || 1) * days,
      0
    );
    const basePrice = Number(guidePrice || 0) * people * days;
    const discount = people >= 6 ? Math.round((basePrice + assetTotal) * 0.08) : 0;
    return {
      basePrice,
      assetTotal,
      discount,
      total: Math.max(0, basePrice + assetTotal - discount),
    };
  }, [days, guidePrice, people, selectedAssets]);

  return (
    <aside className="sticky top-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all duration-300 lg:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-green-600">Live cart</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Package summary</h2>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">{days} day{days === 1 ? "" : "s"}</span>
      </div>

      <div className="mb-5 space-y-3">
        {selectedAssets.length ? (
          <AnimatePresence initial={false}>
            {selectedAssets.map((asset) => (
            <motion.div
              key={asset.assetId}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              className="rounded-2xl bg-slate-50 p-3 transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">{asset.name}</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    {money(asset.pricePerDay)} x {asset.quantity} x {days} days
                  </p>
                </div>
                <strong className="text-sm text-slate-900">{money(asset.pricePerDay * asset.quantity * days)}</strong>
              </div>
            </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Add assets to start building your package.
          </div>
        )}
      </div>

      <PriceBreakdown estimate={estimate} liveTotals={liveTotals} />

      {estimate ? (
        <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-800">
          Price lock expires in <span className="font-black">{formatTime(remaining)}</span>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          className="rounded-full bg-slate-900 px-5 py-3 font-bold text-white shadow-md transition hover:scale-105 disabled:opacity-50"
          onClick={onEstimate}
          disabled={estimating}
        >
          {estimating ? "Calculating..." : "Get Estimate"}
        </button>
        <button
          type="button"
          className="rounded-full bg-green-500 px-5 py-3 font-bold text-white shadow-md transition hover:scale-105 hover:bg-green-600 disabled:opacity-50"
          onClick={onSave}
          disabled={saving || !estimate}
        >
          {saving ? "Locking..." : "Lock & Proceed to Payment"}
        </button>
      </div>
    </aside>
  );
};

export default PackageSummary;
