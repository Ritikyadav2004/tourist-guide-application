import { Link } from "react-router-dom";

const getGuideImage = (guide) => {
  const src = guide?.avatar || guide?.photo || guide?.image;
  if (!src) return "/default_profile.jpg";
  return src.startsWith("http") ? src : `http://localhost:5000/uploads/${src}`;
};

const GuideCard = ({ guide }) => {
  const guideId = guide?._id || guide?.id;

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg">
      <Link to={`/guide/${encodeURIComponent(guideId || guide?.name || "guide")}`}>
        <img src={getGuideImage(guide)} alt={guide?.name || "Guide"} className="h-48 w-full rounded-2xl object-cover" />
      </Link>
      <div className="mt-4">
        <h3 className="text-xl font-bold text-slate-900">{guide?.name}</h3>
        <p className="text-sm text-slate-500">{guide?.location?.city || guide?.location?.state || "Local guide"}</p>
        <p className="mt-2 font-bold text-slate-900">Rs. {guide?.price || 0} / day</p>
        <div className="mt-4 flex gap-2">
          <Link
            className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-bold text-white shadow-md transition hover:scale-105"
            to={`/guide/${encodeURIComponent(guideId || guide?.name || "guide")}`}
          >
            View Profile
          </Link>
        </div>
      </div>
    </article>
  );
};

export default GuideCard;
