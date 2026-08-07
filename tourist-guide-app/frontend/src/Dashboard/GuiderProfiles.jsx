// import { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { Link, useLocation } from "react-router-dom";
// import { setLocationFilter } from "../action/uiActions";
// import { getGuides } from "../services/api";
// import "./GuiderProfiles.css";

// const getGuideSlug = (guide) =>
//   encodeURIComponent(guide?._id || guide?.name || "guide");

// const getGuideImage = (guide) => {
//   const src = guide?.avatar || guide?.photo || guide?.image;
//   if (!src) return "/default_profile.jpg";
//   return src.startsWith("http") ? src : `http://localhost:5000/uploads/${src}`;
// };

// const GuiderProfiles = () => {
//   const [guides, setGuides] = useState([]);
//   const [filteredGuides, setFilteredGuides] = useState([]);
//   const [search, setSearch] = useState("");
//   const dispatch = useDispatch();
//   const routeLocation = useLocation();
//   const location = useSelector((state) => state.ui?.locationFilter || "");
//   const liveCount = filteredGuides.length || guides.length;

//   useEffect(() => {
//     fetchGuides();
//   }, []);

//   const fetchGuides = async () => {
//     try {
//       const data = await getGuides();
//       const guideList = Array.isArray(data?.guides)
//         ? data.guides
//         : Array.isArray(data)
//         ? data
//         : [];

//       setGuides(guideList);
//       setFilteredGuides(guideList);
//     } catch (err) {
//       console.error("Failed to load guides:", err);
//       setGuides([]);
//       setFilteredGuides([]);
//     }
//   };

//   const formatLocation = (loc) => {
//     if (!loc) return "Location not provided";
//     if (typeof loc === "string") return loc;
//     if (typeof loc === "object") {
//       const parts = [loc.city, loc.state, loc.country].filter(Boolean);
//       return parts.length ? parts.join(", ") : "Location not provided";
//     }
//     return "Location not provided";
//   };

//   useEffect(() => {
//     const params = new URLSearchParams(routeLocation.search);
//     setSearch(params.get("search") || "");
//   }, [routeLocation.search]);

//   useEffect(() => {
//     const filtered = guides.filter((guide) => {
//       const name = (guide.name || "").toLowerCase();
//       const locString = formatLocation(guide.location).toLowerCase();
//       const normalizedSearch = search.toLowerCase().trim();
//       const matchesSearch =
//         normalizedSearch === "" ||
//         name.includes(normalizedSearch) ||
//         locString.includes(normalizedSearch);
//       const matchesLocation =
//         location === "" || locString.includes(location.toLowerCase());

//       return (
//         matchesSearch &&
//         matchesLocation
//       );
//     });

//     setFilteredGuides(filtered);
//   }, [search, location, guides]);

//   const locationOptions = useMemo(() => {
//     const set = new Set();
//     guides.forEach((g) => {
//       const loc = formatLocation(g.location);
//       if (loc && loc !== "Location not provided") {
//         // split by comma to allow city/state selection
//         loc.split(",").map((s) => s.trim()).filter(Boolean).forEach((part) => set.add(part));
//       }
//     });
//     return Array.from(set).sort((a, b) => a.localeCompare(b));
//   }, [guides]);

//   return (
//     <div className="guides-section" id="guides">
//       <div className="guides-header">
//         <div className="header-left">
//           <h1>Available Guides Near You</h1>
//           <p className="subtitle">
//             {liveCount
//               ? `${liveCount} guide${liveCount > 1 ? "s" : ""} ready to make your trip unforgettable`
//               : "Explore trusted local guides"}
//           </p>

//           <div className="search-row">
//             <input
//               type="text"
//               placeholder="Search guide..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>
//         </div>

//         <div className="header-right">
//           <select
//             value={location}
//             onChange={(e) => dispatch(setLocationFilter(e.target.value))}
//           >
//             <option value="">All Locations</option>
//             {locationOptions.map((loc) => (
//               <option key={loc} value={loc}>
//                 {loc}
//               </option>
//             ))}
//           </select>

//           <select>
//             <option>Recommended</option>
//             <option>Top Rated</option>
//             <option>Price: Low to High</option>
//           </select>
//         </div>
//       </div>

//       {/* Guide Cards */}
//       <div className="guide-grid">
//         {filteredGuides.map((guide, idx) => (
//           <div key={guide._id || idx} className="guide-card">
//             <Link to={`/guide/${getGuideSlug(guide)}`}>
//               <img
//                 src={getGuideImage(guide)}
//                 alt={guide.name}
//               />
//             </Link>
//             <div className="guide-card-content">
//               <Link to={`/guide/${getGuideSlug(guide)}`}>
//                 <h3>{guide.name}</h3>
//               </Link>
//               <p>{formatLocation(guide.location)}</p>
//               <p className="price">Rs. {guide.price} / day</p>
//               <div className="guide-actions">
//                 <Link 
//                   to={`/guide/${getGuideSlug(guide)}`}
//                   className="guide-cta"
//                 >
//                   View Profile
//                 </Link>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default GuiderProfiles;

//
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { setLocationFilter } from "../action/uiActions";
import { getGuides } from "../services/api";

// ---------- Helpers ----------
const getGuideSlug = (guide) =>
  encodeURIComponent(guide?._id || guide?.name || "guide");

const getGuideImage = (guide) => {
  const src = guide?.avatar || guide?.photo || guide?.image;
  if (!src) return "/default_profile.jpg";
  return src.startsWith("http") ? src : `http://localhost:5000/uploads/${src}`;
};

const formatLocation = (loc) => {
  if (!loc) return "Location not provided";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object") {
    const parts = [loc.city, loc.state, loc.country].filter(Boolean);
    return parts.length ? parts.join(", ") : "Location not provided";
  }
  return "Location not provided";
};

// ---------- Component ----------
const GuiderProfiles = () => {
  const [guides, setGuides] = useState([]);
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const routeLocation = useLocation();
  const location = useSelector((state) => state.ui?.locationFilter || "");
  const liveCount = filteredGuides.length || guides.length;

  // Fetch guides on mount
  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const data = await getGuides();
      const guideList = Array.isArray(data?.guides)
        ? data.guides
        : Array.isArray(data)
        ? data
        : [];

      setGuides(guideList);
      setFilteredGuides(guideList);
    } catch (err) {
      console.error("Failed to load guides:", err);
      setGuides([]);
      setFilteredGuides([]);
    }
  };

  // Read search from URL query param
  useEffect(() => {
    const params = new URLSearchParams(routeLocation.search);
    setSearch(params.get("search") || "");
  }, [routeLocation.search]);

  // Filter guides based on search and location
  useEffect(() => {
    const filtered = guides.filter((guide) => {
      const name = (guide.name || "").toLowerCase();
      const locString = formatLocation(guide.location).toLowerCase();
      const normalizedSearch = search.toLowerCase().trim();
      const matchesSearch =
        normalizedSearch === "" ||
        name.includes(normalizedSearch) ||
        locString.includes(normalizedSearch);
      const matchesLocation =
        location === "" || locString.includes(location.toLowerCase());

      return matchesSearch && matchesLocation;
    });

    setFilteredGuides(filtered);
  }, [search, location, guides]);

  // Unique location parts for filter dropdown
  const locationOptions = useMemo(() => {
    const set = new Set();
    guides.forEach((g) => {
      const loc = formatLocation(g.location);
      if (loc && loc !== "Location not provided") {
        loc.split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((part) => set.add(part));
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [guides]);

  // ---------- Render ----------
  return (
    <section className="mt-5 px-4 sm:px-6 lg:px-8" id="guides">
      {/* Header */}
      <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            Available Guides Near You
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {liveCount
              ? `${liveCount} guide${liveCount > 1 ? "s" : ""} ready to make your trip unforgettable`
              : "Explore trusted local guides"}
          </p>

          <div className="mt-3">
            <input
              type="text"
              placeholder="Search guide..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-200 px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 sm:w-80"
            />
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <select
            value={location}
            onChange={(e) => dispatch(setLocationFilter(e.target.value))}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Locations</option>
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500">
            <option>Recommended</option>
            <option>Top Rated</option>
            <option>Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Guide Grid */}
      {filteredGuides.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-600">No guides match your filters.</p>
          <p className="text-sm text-slate-400">Try adjusting your search or location.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredGuides.map((guide, idx) => (
            <div
              key={guide._id || idx}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <Link to={`/guide/${getGuideSlug(guide)}`}>
                <img
                  src={getGuideImage(guide)}
                  alt={guide.name}
                  className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </Link>
              <div className="p-4 text-center">
                <Link to={`/guide/${getGuideSlug(guide)}`}>
                  <h3 className="text-lg font-bold text-slate-900 hover:text-emerald-600">
                    {guide.name}
                  </h3>
                </Link>
                <p className="mt-1 text-sm text-slate-500">{formatLocation(guide.location)}</p>
                <p className="mt-2 text-lg font-black text-emerald-600">
                  ₹{Number(guide.price || guide.pricePerDay || 0).toLocaleString("en-IN")} / day
                </p>
                <div className="mt-4">
                  <Link
                    to={`/guide/${getGuideSlug(guide)}`}
                    className="inline-block rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-600 hover:scale-105"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default GuiderProfiles;
