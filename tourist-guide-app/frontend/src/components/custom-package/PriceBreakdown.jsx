import { motion } from "framer-motion";

const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const PriceBreakdown = ({ estimate, liveTotals }) => {
  const source = estimate || liveTotals || {};
  const discount = source.discount ?? source.discountAmount ?? source.groupDiscountAmount ?? 0;
  const total = source.totalEstimate ?? source.total ?? 0;

  return (
    <motion.div
      key={total}
      initial={{ scale: 0.98 }}
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Price breakdown</h3>
        {estimate ? <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Estimated</span> : null}
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Base guide fee</span>
          <strong className="text-slate-900">{money(source.basePrice)}</strong>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Assets total</span>
          <strong className="text-slate-900">{money(source.assetTotal)}</strong>
        </div>
        <div className="flex justify-between text-green-700">
          <span>Group discount</span>
          <strong>-{money(discount)}</strong>
        </div>
        <div className="border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Grand total</span>
            <strong className="text-2xl font-black text-slate-900">{money(total)}</strong>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PriceBreakdown;
