import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const categories = [
  { value: "all", label: "All", icon: "fa-layer-group" },
  { value: "bike", label: "Bikes", icon: "fa-motorcycle" },
  { value: "car", label: "Cars", icon: "fa-car" },
  { value: "hotel", label: "Hotels", icon: "fa-hotel" },
  { value: "camera", label: "Cameras", icon: "fa-camera" },
  { value: "other", label: "Other", icon: "fa-box" },
];

const categoryIcons = {
  bike: "fa-motorcycle",
  car: "fa-car",
  camera: "fa-camera",
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
    <section className="asset-selector-panel">
      <div className="asset-selector-header">
        <div className="custom-section-heading">
          <p>House your assets</p>
          <h2>Add trip gear and rentals</h2>
          <span>Pick the essentials that make your trip smoother.</span>
        </div>
        <div className="asset-tabs" role="tablist" aria-label="Asset categories">
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              role="tab"
              aria-selected={activeCategory === category.value}
              className={`asset-tab ${activeCategory === category.value ? "asset-tab-active" : ""}`}
              onClick={() => setActiveCategory(category.value)}
            >
              <i className={`fa-solid ${category.icon}`} aria-hidden="true"></i>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {!filteredAssets.length ? (
        <div className="asset-empty-state">
          <div className="asset-empty-illustration" aria-hidden="true">
            <i className="fa-solid fa-suitcase-rolling"></i>
          </div>
          <h3>No assets are available in this category yet.</h3>
          <p>Try another category or check back later for fresh local rentals.</p>
          <button type="button" className="custom-secondary-button" onClick={() => setActiveCategory("all")}>
            Browse other categories
          </button>
        </div>
      ) : (
        <div className="asset-grid">
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
                className={`asset-card-modern ${selected ? "asset-card-selected" : ""}`}
              >
                <div className="asset-card-media">
                  {src ? (
                    <img src={src} alt={asset.name} />
                  ) : (
                    <div className="asset-card-placeholder">
                      <i className={`fa-solid ${categoryIcons[type] || categoryIcons.other}`} />
                    </div>
                  )}
                  <span className="asset-type-pill">{type}</span>
                  <span className="asset-available-pill">{available} left</span>
                </div>

                <div className="asset-card-body">
                  <div>
                    <h3>{asset.name}</h3>
                    <p>{asset.description || "Reliable rental asset for this custom tour."}</p>
                  </div>

                  <div className="asset-price-row">
                    <div>
                      <p>Rs. {Number(asset.pricePerDay || asset.price || 0).toLocaleString("en-IN")}</p>
                      <span>per day</span>
                    </div>
                    <div>Premium pick</div>
                  </div>

                  {selected ? (
                    <div className="asset-quantity-row">
                      <button
                        type="button"
                        className="asset-quantity-button"
                        onClick={() =>
                          selected.quantity <= 1
                            ? onRemove(asset._id)
                            : onQuantityChange(asset._id, selected.quantity - 1)
                        }
                      >
                        -
                      </button>
                      <span>{selected.quantity} selected</span>
                      <button
                        type="button"
                        className="asset-quantity-button"
                        disabled={selected.quantity >= available}
                        onClick={() => onQuantityChange(asset._id, selected.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="custom-primary-button full-width" onClick={() => onAdd(asset)}>
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
