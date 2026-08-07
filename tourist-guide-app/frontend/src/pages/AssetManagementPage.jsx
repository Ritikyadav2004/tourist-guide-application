import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../Dashboard/DashboardLayout";
import { createAsset, getMyAssets, updateAsset, deleteAsset } from "../services/api";
import "./AssetManagementPage.css";

const AssetManagementPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pricePerDay: "",
    quantityAvailable: "1",
    type: "other",
    images: []
  });

  const assetTypes = [
    { value: "bike", label: "🏍️ Bike", icon: "🏍️" },
    { value: "car", label: "🚗 Car", icon: "🚗" },
    { value: "hotel", label: "🏨 Hotel", icon: "🏨" },
    { value: "camera", label: "📷 Camera", icon: "📷" },
    { value: "other", label: "📦 Other", icon: "📦" }
  ];

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    
    if (user?.role !== "guide") {
      setError("Only guides can manage assets");
      setLoading(false);
      return;
    }
    
    loadAssets();
  }, [token, user]);

  const loadAssets = async () => {
    try {
      const data = await getMyAssets();
      setAssets(data.assets || []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }
    setFormData(prev => ({ ...prev, images: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.pricePerDay) {
      setError("Name and price are required");
      return;
    }

    try {
      const assetData = {
        ...formData,
        pricePerDay: Number(formData.pricePerDay),
        quantityAvailable: Number(formData.quantityAvailable)
      };

      if (editingAsset) {
        await updateAsset(editingAsset._id, assetData);
        setMessage("Asset updated successfully");
      } else {
        await createAsset(assetData);
        setMessage("Asset created successfully");
      }

      setFormData({
        name: "",
        description: "",
        pricePerDay: "",
        quantityAvailable: "1",
        type: "other",
        images: []
      });
      setShowForm(false);
      setEditingAsset(null);
      await loadAssets();
    } catch (err) {
      setError(err.message || "Failed to save asset");
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      description: asset.description,
      pricePerDay: asset.pricePerDay,
      quantityAvailable: asset.quantityAvailable,
      type: asset.type,
      images: []
    });
    setShowForm(true);
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    
    try {
      await deleteAsset(assetId);
      setMessage("Asset deleted successfully");
      await loadAssets();
    } catch (err) {
      setError(err.message || "Failed to delete asset");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAsset(null);
    setFormData({
      name: "",
      description: "",
      pricePerDay: "",
      quantityAvailable: "1",
      type: "other",
      images: []
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="asset-page">
          <p>Loading assets...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="asset-page">
        <div className="asset-header">
          <div>
            <h1>My Assets</h1>
            <p>Manage your rental equipment - bikes, cars, cameras, etc.</p>
          </div>
          <button 
            className="primary-btn"
            onClick={() => setShowForm(true)}
          >
            + Add Asset
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {message && <div className="success-banner">{message}</div>}

        {showForm && (
          <div className="asset-form-overlay">
            <div className="asset-form-card">
              <h2>{editingAsset ? "Edit Asset" : "Add New Asset"}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Asset Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Honda Activa 6G"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                    >
                      {assetTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Price per Day (₹) *</label>
                    <input
                      type="number"
                      name="pricePerDay"
                      value={formData.pricePerDay}
                      onChange={handleInputChange}
                      placeholder="500"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Available Quantity *</label>
                    <input
                      type="number"
                      name="quantityAvailable"
                      value={formData.quantityAvailable}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your asset features, condition, etc."
                      rows="3"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Images (Max 5)</label>
                    <input
                      type="file"
                      name="images"
                      onChange={handleImageChange}
                      accept="image/*"
                      multiple
                    />
                    <small>Upload clear photos of your asset</small>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="ghost-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    {editingAsset ? "Update Asset" : "Create Asset"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!assets.length ? (
          <div className="empty-state">
            <h3>No assets yet</h3>
            <p>Add your rental equipment to let tourists book them along with tours.</p>
          </div>
        ) : (
          <div className="asset-grid">
            {assets.map(asset => {
              const typeInfo = assetTypes.find(t => t.value === asset.type) || assetTypes[4];
              return (
                <div key={asset._id} className="asset-card">
                  <div className="asset-header">
                    <span className="asset-icon">{typeInfo.icon}</span>
                    <div className="asset-info">
                      <h3>{asset.name}</h3>
                      <span className="asset-type">{typeInfo.label}</span>
                    </div>
                  </div>
                  
                  <div className="asset-details">
                    <div className="detail-item">
                      <span>₹{asset.pricePerDay}/day</span>
                    </div>
                    <div className="detail-item">
                      <span>{asset.quantityAvailable} available</span>
                    </div>
                  </div>

                  {asset.description && (
                    <p className="asset-description">{asset.description}</p>
                  )}

                  {asset.images?.length > 0 && (
                    <div className="asset-images">
                      {asset.images.slice(0, 3).map((img, idx) => (
                        <img key={idx} src={img} alt={`${asset.name} ${idx + 1}`} />
                      ))}
                    </div>
                  )}

                  <div className="asset-actions">
                    <button className="ghost-btn" onClick={() => handleEdit(asset)}>
                      Edit
                    </button>
                    <button className="danger-btn" onClick={() => handleDelete(asset._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssetManagementPage;
