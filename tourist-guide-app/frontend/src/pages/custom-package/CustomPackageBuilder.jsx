import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../../Dashboard/DashboardLayout";
import AssetSelector from "../../components/custom-package/AssetSelector";
import PackageSummary from "../../components/custom-package/PackageSummary";
import { estimateCustomPackage, saveCustomPackage } from "../../action/customPackageActions";
import { getGuideAssets, getGuideTemplates, getGuides, getPosts } from "../../services/api";

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const getImage = (guide) => {
  const src = guide?.avatar || guide?.photo || guide?.image;
  if (!src) return "/default_profile.jpg";
  return src.startsWith("http") ? src : `http://localhost:5000/uploads/${src}`;
};

const CustomPackageBuilder = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { user, token } = useSelector((state) => state.auth);
  const packageState = useSelector((state) => state.customPackage || {});

  const guideId = searchParams.get("guideId") || "";
  const postId = searchParams.get("postId") || "";

  const [guide, setGuide] = useState(null);
  const [post, setPost] = useState(null);
  const [assets, setAssets] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    startDate: today(),
    endDate: addDays(2),
    numberOfPeople: 2,
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [guidesData, postsData, assetsData, templatesData] = await Promise.all([
          getGuides(),
          getPosts(1, 200),
          guideId ? getGuideAssets(guideId) : Promise.resolve({ assets: [] }),
          guideId ? getGuideTemplates(guideId) : Promise.resolve({ templates: [] }),
        ]);

        const guides = Array.isArray(guidesData?.guides) ? guidesData.guides : Array.isArray(guidesData) ? guidesData : [];
        const posts = Array.isArray(postsData?.posts) ? postsData.posts : [];
        const resolvedGuide = guides.find((item) => String(item._id) === String(guideId)) || null;
        const resolvedPost =
          posts.find((item) => String(item._id) === String(postId)) ||
          posts.find((item) => String(item?.postedBy?._id || item?.postedBy) === String(guideId)) ||
          null;

        setGuide(resolvedGuide);
        setPost(resolvedPost);
        setAssets(Array.isArray(assetsData?.assets) ? assetsData.assets : []);
        setTemplates(Array.isArray(templatesData?.templates) ? templatesData.templates : []);
      } catch (err) {
        setError(err?.message || "Unable to load custom package data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [dispatch, guideId, navigate, postId, token]);

  const days = useMemo(() => {
    const start = new Date(`${form.startDate}T00:00:00`);
    const end = new Date(`${form.endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;
    return Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)) + 1);
  }, [form.endDate, form.startDate]);

  const selectedAssetList = useMemo(() => Object.values(selectedAssets), [selectedAssets]);
  const guidePrice = Number(post?.price || guide?.price || 0);
  const estimate = packageState.estimate?.estimate || packageState.estimate || null;

  const handleAddAsset = (asset) => {
    setSelectedAssets((current) => ({
      ...current,
      [asset._id]: {
        assetId: asset._id,
        name: asset.name,
        type: asset.type || asset.category || "other",
        pricePerDay: Number(asset.pricePerDay || asset.price || 0),
        quantity: 1,
      },
    }));
  };

  const handleRemoveAsset = (assetId) => {
    setSelectedAssets((current) => {
      const next = { ...current };
      delete next[assetId];
      return next;
    });
  };

  const handleQuantityChange = (assetId, quantity) => {
    setSelectedAssets((current) => ({
      ...current,
      [assetId]: { ...current[assetId], quantity: Number(quantity) },
    }));
  };

  const packagePayload = () => ({
    guideId,
    postId: post?._id || postId,
    startDate: form.startDate,
    endDate: form.endDate,
    numberOfPeople: Number(form.numberOfPeople),
    selectedAssets: selectedAssetList.map((asset) => ({
      assetId: asset.assetId,
      quantity: asset.quantity,
    })),
  });

  const validate = () => {
    if (!guideId) return "Choose a guide before building a package.";
    if (!form.startDate || !form.endDate) return "Select both start and end dates.";
    if (new Date(form.endDate) < new Date(form.startDate)) return "End date cannot be before start date.";
    if (Number(form.numberOfPeople) < 1 || Number(form.numberOfPeople) > 20) return "People must be between 1 and 20.";
    return "";
  };

  const handleEstimate = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    try {
      await dispatch(estimateCustomPackage(packagePayload()));
    } catch (err) {
      setError(err?.message || "Unable to calculate estimate.");
    }
  };

  const handleSave = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    try {
      const result = await dispatch(saveCustomPackage(packagePayload()));
      const bookingId = result?.booking?._id;
      const packageId = result?.package?._id;
      navigate(bookingId ? `/payment?bookingId=${bookingId}` : `/custom-package/success?packageId=${packageId || ""}`);
    } catch (err) {
      setError(err?.message || "Unable to save package.");
    }
  };

  const applyTemplate = (template) => {
    const next = {};
    (template.assets || []).forEach((item) => {
      const assetId = item.assetId?._id || item.assetId;
      const asset = assets.find((entry) => String(entry._id) === String(assetId));
      if (!asset) return;
      next[asset._id] = {
        assetId: asset._id,
        name: asset.name,
        type: asset.type || asset.category || "other",
        pricePerDay: Number(item.fixedPrice || asset.pricePerDay || asset.price || 0),
        quantity: Number(item.quantity || 1),
      };
    });
    setSelectedAssets(next);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <main className="min-h-screen bg-[#f8fafc] p-6">
          <div className="rounded-2xl bg-white p-8 text-slate-600 shadow-sm">Loading custom package builder...</div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-h-screen bg-[#f8fafc] px-4 py-6 text-slate-900 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <button
              type="button"
              className="mb-4 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:scale-105"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <img src={getImage(guide)} alt={guide?.name || "Guide"} className="h-20 w-20 rounded-full object-cover ring-4 ring-green-100" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-green-600">Custom package</p>
                  <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">{guide?.name || "Selected guide"}</h1>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Rating {guide?.averageRating || 0}/5 · {post?.title || "Flexible local experience"}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900 px-5 py-4 text-white">
                <p className="text-xs font-bold uppercase text-green-300">Base guide fee</p>
                <strong className="text-2xl">Rs. {guidePrice.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </header>

          {error || packageState.error ? (
            <div className="rounded-2xl bg-red-50 p-4 font-semibold text-red-700 ring-1 ring-red-100">
              {error || packageState.error}
            </div>
          ) : null}

          <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-green-600">Select dates & people</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">Trip basics</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Start date
                <input
                  type="date"
                  min={today()}
                  value={form.startDate}
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-green-500"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                End date
                <input
                  type="date"
                  min={form.startDate || today()}
                  value={form.endDate}
                  onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-green-500"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Number of people
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.numberOfPeople}
                  onChange={(event) => setForm((current) => ({ ...current, numberOfPeople: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-green-500"
                />
              </label>
            </div>
          </section>

          {templates.length ? (
            <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-green-600">Package templates</p>
                  <h2 className="text-2xl font-bold text-slate-900">Start from a proven setup</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {templates.map((template) => (
                  <article key={template._id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 transition hover:shadow-lg">
                    <h3 className="font-bold text-slate-900">{template.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{template.description || "Pre-built asset combination."}</p>
                    <button
                      type="button"
                      className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-green-700 shadow-sm transition hover:scale-105"
                      onClick={() => applyTemplate(template)}
                    >
                      Apply template
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <AssetSelector
              assets={assets}
              selectedAssets={selectedAssets}
              onAdd={handleAddAsset}
              onRemove={handleRemoveAsset}
              onQuantityChange={handleQuantityChange}
            />
            <PackageSummary
              selectedAssets={selectedAssetList}
              days={days}
              people={Number(form.numberOfPeople || 1)}
              guidePrice={guidePrice}
              estimate={estimate}
              onEstimate={handleEstimate}
              onSave={handleSave}
              estimating={packageState.estimating}
              saving={packageState.saving}
            />
          </div>
        </div>
      </motion.main>
    </DashboardLayout>
  );
};

export default CustomPackageBuilder;
