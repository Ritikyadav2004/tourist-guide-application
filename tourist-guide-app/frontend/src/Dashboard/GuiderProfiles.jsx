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
import { getGuides, getPosts } from "../services/api";
import "./GuiderProfiles.css";

// ---------- Helpers ----------
const getGuideSlug = (guide) =>
  encodeURIComponent(guide?._id || guide?.name || "guide");

const getGuideImage = (guide) => {
  const src = guide?.avatar || guide?.photo || guide?.image;
  if (!src || src === "default-avatar-url" || src === "default_avatar.jpg") {
    return "/default_profile.jpg";
  }
  return src.startsWith("http") ? src : `http://localhost:5000/uploads/${src}`;
};

const hasGuideImage = (guide) => {
  const src = guide?.avatar || guide?.photo || guide?.image;
  return src && src !== "default-avatar-url" && src !== "default_avatar.jpg" && src !== "/default_profile.jpg";
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAvatarBgColor = () => {
  return "#0f766e";
};

const formatLocation = (loc) => {
  if (!loc) return "Location not shared yet";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object") {
    const parts = [loc.city, loc.state, loc.country].filter(Boolean);
    return parts.length ? parts.join(", ") : "Location not shared yet";
  }
  return "Location not shared yet";
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
      const [guidesData, postsData] = await Promise.all([
        getGuides(),
        getPosts(1, 200)
      ]);

      const guideList = Array.isArray(guidesData?.guides)
        ? guidesData.guides
        : Array.isArray(guidesData)
        ? guidesData
        : [];

      const postsList = Array.isArray(postsData?.posts)
        ? postsData.posts
        : [];

      // Map guide price from their post (if any post exists, use its price; else default to 0)
      const guidesWithPrice = guideList.map((g) => {
        const guidePost = postsList.find(p => String(p.postedBy?._id || p.postedBy) === String(g._id));
        return {
          ...g,
          price: guidePost?.price || g.price || 0
        };
      });

      setGuides(guidesWithPrice);
      setFilteredGuides(guidesWithPrice);
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
      if (loc && loc !== "Location not shared yet") {
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
    <section className="guides-section" id="guides">
      {/* Header */}
      <div className="guides-header">
        <div className="guides-title">
          <p className="guides-kicker">Trusted locals</p>
          <h2 className="section-title">Available Guides Near You</h2>
          <p className="section-subtitle">
            {liveCount
              ? `${liveCount} guide${liveCount > 1 ? "s" : ""} ready to make your trip unforgettable`
              : "Explore trusted local guides"}
          </p>

          {/* Search guides is now consolidated to the main hero section */}
        </div>

        <div className="guides-filters">
          <select
            value={location}
            onChange={(e) => dispatch(setLocationFilter(e.target.value))}
          >
            <option value="">All Locations</option>
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select>
            <option>Recommended</option>
            <option>Top Rated</option>
            <option>Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Guide Grid */}
      {filteredGuides.length === 0 ? (
        <div className="guides-empty">
          <p>No guides match your filters.</p>
          <span>Try adjusting your search or location.</span>
        </div>
      ) : (
        <div className="guides-grid">
          {filteredGuides.map((guide, idx) => (
            <div
              key={guide._id || idx}
              className="guide-card"
            >
              <Link className="guide-image-link" to={`/guide/${getGuideSlug(guide)}`}>
                {hasGuideImage(guide) ? (
                  <img
                    src={getGuideImage(guide)}
                    alt={guide.name}
                  />
                ) : (
                  <div
                    className="guide-avatar-initials"
                    style={{ backgroundColor: getAvatarBgColor(guide.name) }}
                  >
                    {getInitials(guide.name)}
                  </div>
                )}
              </Link>
              <div className="guide-card-body">
                <Link to={`/guide/${getGuideSlug(guide)}`}>
                  <h3>{guide.name}</h3>
                </Link>
                <p className="guide-location">{formatLocation(guide.location)}</p>
                
                {/* Rating display */}
                <div className="guide-rating-row" aria-label={`Rating ${(guide.averageRating || 0).toFixed(1)} out of 5`}>
                  <span className="guide-star">★</span>
                  <span className="guide-rating-val">{(guide.averageRating || 0).toFixed(1)}</span>
                </div>

                {/* Languages display */}
                {guide.languages && (Array.isArray(guide.languages) ? guide.languages.length > 0 : String(guide.languages).trim()) ? (
                  <div className="guide-languages-row">
                    <span className="guide-lang-tag">
                      {Array.isArray(guide.languages)
                        ? guide.languages.join(", ")
                        : String(guide.languages)}
                    </span>
                  </div>
                ) : null}

                <p className="guide-price">
                  Rs. {Number(guide.price || guide.pricePerDay || 0).toLocaleString("en-IN")} / day
                </p>
                <div className="guide-card-actions">
                  <Link
                    to={`/guide/${getGuideSlug(guide)}`}
                    className="guide-profile-link"
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
