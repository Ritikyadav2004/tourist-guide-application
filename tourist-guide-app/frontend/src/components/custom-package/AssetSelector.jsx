import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const categories = [
  { value: "all", label: "All" },
  { value: "bike", label: "Bikes" },
  { value: "car", label: "Cars" },
  { value: "camera", label: "Cameras" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
];

const categoryIcons = {
  bike: "fa-motorcycle",
  car: "fa-car",
  camera: "fa-camera",
  equipment: "fa-toolbox",
  hotel: "fa-hotel",
  other: "fa-box",
};

const imageUrl = (asset) => {
  const src = asset?.image || asset?.photo || asset?.images?.[0];
  if (!src) return "";
  return src.startsWith("http") ? src : `http://localhost:5000/uploads/${src}`;
};

const getAssetType = (asset) => String(asset?.type || asset?.category || "other").toLowerCase();

const AssetSelector = ({ assets = [], selectedAssets = {}, onAdd, onRemove, onQuantityChange }) => {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredAssets = useMemo(() => {
    if (activeCategory === "all") return assets;
    return assets.filter((asset) => getAssetType(asset) === activeCategory);
  }, [activeCategory, assets]);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-4 shadow-sm transition-all duration-300 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Choose your assets
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">
            Add trip gear and rentals
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pick the essentials that make your trip smoother.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => setActiveCategory(category.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 hover:scale-105 ${
                activeCategory === category.value
                  ? "bg-emerald-500 text-white shadow-md"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {!filteredAssets.length ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/70 p-10 text-center text-slate-500 shadow-inner">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
            <i className="fa fa-box" />
          </div>
          <p className="text-base font-semibold text-slate-700">
            No assets are available in this category yet.
          </p>
          <p className="mt-1 text-sm">Try another category or come back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssets.map((asset) => {
            const selected = selectedAssets[asset._id];
            const type = getAssetType(asset);
            const src = imageUrl(asset);
            const available = Math.max(Number(asset.quantityAvailable || asset.availableQuantity || asset.quantity || 1), 0);

            return (
              <motion.article
                key={asset._id}
                layout
                whileHover={{ scale: 1.02, y: -4 }}
                className={`group overflow-hidden rounded-[24px] border bg-white shadow-sm transition-all duration-300 hover:shadow-xl ${
                  selected ? "border-emerald-400 ring-2 ring-emerald-100" : "border-slate-200"
                }`}
              >
                <div className="relative aspect-4/3 bg-gradient-to-br from-slate-100 to-slate-200">
                  {src ? (
                    <img src={src} alt={asset.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl text-slate-400">
                      <i className={`fa ${categoryIcons[type] || categoryIcons.other}`} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-slate-900/10 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-700 shadow-sm">
                    {type}
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-full bg-emerald-500/95 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    {available} left
                  </span>
                </div>

                <div className="space-y-4 p-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{asset.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                      {asset.description || "Reliable rental asset for this custom tour."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                    <div>
                      <p className="text-xl font-black text-slate-900">
                        ₹{Number(asset.pricePerDay || asset.price || 0).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">per day</p>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      Premium pick
                    </div>
                  </div>

                  {selected ? (
                    <div className="flex items-center justify-between gap-3 rounded-full bg-emerald-50 p-1">
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-slate-800 shadow-sm transition hover:scale-105"
                        onClick={() =>
                          selected.quantity <= 1
                            ? onRemove(asset._id)
                            : onQuantityChange(asset._id, selected.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className="text-sm font-bold text-emerald-700">
                        {selected.quantity} selected
                      </span>
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-slate-800 shadow-sm transition hover:scale-105 disabled:opacity-40"
                        disabled={selected.quantity >= available}
                        onClick={() => onQuantityChange(asset._id, selected.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full rounded-full bg-emerald-500 px-4 py-3 font-bold text-white shadow-md transition hover:scale-[1.01] hover:bg-emerald-600"
                      onClick={() => onAdd(asset)}
                    >
                      + Add to package
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AssetSelector;
