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
    let discountPercent = 0;
    if (people >= 5 && people < 8) discountPercent = 0.1;
    else if (people >= 8 && people < 10) discountPercent = 0.15;
    else if (people >= 10) discountPercent = 0.2;
    const discount = Math.round(basePrice * discountPercent);
    return { basePrice, assetTotal, discount, total: Math.max(0, basePrice + assetTotal - discount) };
  }, [days, guidePrice, people, selectedAssets]);

  return (
    <aside className="package-summary-panel">
      <div className="summary-topline">
        <div>
          <span><i className="fa-solid fa-cart-shopping" aria-hidden="true"></i> Live cart</span>
          <h2>Package summary</h2>
        </div>
        <strong>{days} day{days === 1 ? "" : "s"}</strong>
      </div>

      <div className="summary-assets-list">
        {selectedAssets.length ? (
          <AnimatePresence initial={false}>
            {selectedAssets.map((asset) => (
              <motion.div
                key={asset.assetId}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                className="summary-asset-item"
              >
                <div>
                  <h3>{asset.name}</h3>
                  <p>{money(asset.pricePerDay)} x {asset.quantity} x {days} days</p>
                </div>
                <strong>{money(asset.pricePerDay * asset.quantity * days)}</strong>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="summary-empty">Add assets to start building your package.</div>
        )}
      </div>

      <PriceBreakdown estimate={estimate} liveTotals={liveTotals} />

      {estimate ? (
        <div className="price-lock-note">
          Price lock expires in <strong>{formatTime(remaining)}</strong>
        </div>
      ) : null}

      <div className="summary-actions-row">
        <button type="button" className="custom-outline-button" onClick={onEstimate} disabled={estimating}>
          {estimating ? "Calculating..." : "Get Estimate"}
        </button>
        <button type="button" className="custom-primary-button" onClick={onSave} disabled={saving || !estimate}>
          {saving ? "Locking..." : "Lock & Proceed to Payment"}
        </button>
      </div>
    </aside>
  );
};

export default PackageSummary;
