import { motion } from "framer-motion";

const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const PriceBreakdown = ({ estimate, liveTotals }) => {
  const isEstimate = Boolean(estimate);
  const source = estimate || liveTotals || {};
  const basePriceTotal = isEstimate ? source.baseTotal : source.basePrice;
  const assetTotal = source.assetTotal || 0;
  const discountAmount = isEstimate ? source.baseTotal - source.discountedBase : source.discount || 0;
  const grandTotal = isEstimate ? source.totalEstimate : source.total;

  return (
    <motion.div
      key={grandTotal}
      initial={{ scale: 0.98 }}
      animate={{ scale: [1, 1.015, 1] }}
      transition={{ duration: 0.35 }}
      className="price-breakdown-card"
    >
      <div className="price-breakdown-header">
        <h3>Price breakdown</h3>
        {isEstimate ? <span>Estimated</span> : null}
      </div>
      <div className="price-breakdown-list">
        <div className="price-row">
          <span>Base guide fee</span>
          <strong>{money(basePriceTotal)}</strong>
        </div>
        <div className="price-row">
          <span>Assets total</span>
          <strong>{money(assetTotal)}</strong>
        </div>
        <div className="price-row discount">
          <span>Group discount</span>
          <strong>-{money(discountAmount)}</strong>
        </div>
        <div className="price-row grand">
          <span>Grand total</span>
          <strong>{money(grandTotal)}</strong>
        </div>
      </div>
    </motion.div>
  );
};

export default PriceBreakdown;
