import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import Navbar from "../Dashboard/Navbar";
import { fetchPosts } from "../action/postActions";
import { getGuides } from "../services/api";
import PostCard from "../Dashboard/myProfiles/PostCard";
import "./StateDetails.css";

const staticPlaces = {
  chandigarh: [
    {
      title: "Rock Garden",
      image: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=800&q=80",
      desc: "A unique garden of sculptures made from urban and industrial waste.",
    },
    {
      title: "Sukhna Lake",
      image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
      desc: "Popular lake for boating and evening strolls.",
    },
  ],
  delhi: [
    {
      title: "Red Fort",
      image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=800&q=80",
      desc: "Historic fortification in Old Delhi constructed of red sandstone.",
    },
    {
      title: "Qutub Minar",
      image: "https://images.unsplash.com/photo-1587135941948-670b381f08e4?auto=format&fit=crop&w=800&q=80",
      desc: "A victory tower and minaret that forms part of the Qutb complex.",
    }
  ],
  punjab: [
    {
      title: "Golden Temple",
      image: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=80",
      desc: "The preeminent spiritual site of Sikhism, located in Amritsar.",
    }
  ],
  goa: [
    {
      title: "Baga Beach",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      desc: "A popular beach in North Goa known for its nightlife and water sports.",
    }
  ]
};

const vibeTags = {
  delhi: ["Heritage", "Street food", "Night bazaars", "Historic Forts"],
  chandigarh: ["Modernist city", "Lakeside views", "Gardens", "Chic Cafés"],
  punjab: ["Golden farms", "Sikh Heritage", "Folk Music", "Tandoori Vibes"],
  goa: ["Sandy beaches", "Sunset cruises", "Beach shacks", "Nightlife"],
  "himachal pradesh": ["Himalayan peaks", "Apple orchards", "Trekking", "Chill vibes"],
  "jammu & kashmir": ["Snow peaks", "Houseboats", "Chinar trees", "Heaven on earth"],
  uttarakhand: ["Lake views", "Pilgrimage sites", "Himalayan escapes", "Yoga centers"],
};

const formatStateName = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const StateDetails = () => {
  const { stateName } = useParams();
  const decodedState = decodeURIComponent(stateName || "");
  const formattedState = formatStateName(decodedState);
  
  const dispatch = useDispatch();
  const { posts = [], loading } = useSelector((state) => state.post || {});
  const { user } = useSelector((state) => state.auth || {});

  const [guides, setGuides] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    if (!posts.length && !loading) {
      dispatch(fetchPosts());
    }
  }, [dispatch, posts.length, loading]);

  useEffect(() => {
    let mounted = true;
    const loadGuides = async () => {
      setGuidesLoading(true);
      try {
        const res = await getGuides();
        const list = Array.isArray(res?.guides)
          ? res.guides
          : Array.isArray(res)
          ? res
          : [];
        if (!mounted) return;
        const filtered = list.filter((g) => {
          const s = (g?.location?.state || "").toLowerCase();
          return s === decodedState.toLowerCase();
        });
        setGuides(filtered);
      } catch (err) {
        console.error("Failed to load guides:", err);
        if (mounted) setGuides([]);
      }
      if (mounted) setGuidesLoading(false);
    };

    loadGuides();

    return () => {
      mounted = false;
    };
  }, [decodedState]);

  const statePosts = useMemo(() => {
    const target = decodedState.toLowerCase();
    return posts.filter((post) => {
      const loc = post?.location;
      const stateValue = typeof loc === "string" ? loc : loc?.state;
      return stateValue && stateValue.toLowerCase() === target;
    });
  }, [posts, decodedState]);

  const sortedPosts = useMemo(() => {
    return [...statePosts].sort((a, b) => {
      const aDate = new Date(a?.createdAt || 0).getTime();
      const bDate = new Date(b?.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }, [statePosts]);

  const cities = useMemo(() => {
    const set = new Set();
    statePosts.forEach((post) => {
      const loc = post?.location;
      const cityVal = typeof loc === "string" ? loc : loc?.city;
      if (cityVal) set.add(cityVal);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [statePosts]);

  useEffect(() => {
    if (!selectedCity && cities.length) {
      setSelectedCity(cities[0]);
    }
  }, [cities, selectedCity]);

  const filteredByCity = useMemo(() => {
    if (!selectedCity) return sortedPosts;
    const target = selectedCity.toLowerCase();
    return sortedPosts.filter((post) => {
      const loc = post?.location;
      const cityVal = typeof loc === "string" ? loc : loc?.city;
      return cityVal && cityVal.toLowerCase() === target;
    });
  }, [sortedPosts, selectedCity]);

  const heroImage = useMemo(() => {
    const withImage = statePosts.find((p) => p?.photo || p?.image);
    return (
      withImage?.photo ||
      withImage?.image ||
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80"
    );
  }, [statePosts]);

  const totalCities = cities.length;
  const totalPosts = statePosts.length;

  const tags = useMemo(() => {
    return vibeTags[decodedState.toLowerCase()] || ["Local gems", "Scenic spots", "Hidden cafés", "Must visit"];
  }, [decodedState]);

  const spots = useMemo(() => {
    return staticPlaces[decodedState.toLowerCase()] || [];
  }, [decodedState]);

  const getGuideSlug = (g) => encodeURIComponent(g?._id || g?.name || "guide");
  const getGuideImage = (guide) => {
    const src = guide?.avatar || guide?.photo || guide?.image;
    if (!src) return "/default_profile.jpg";
    return src.startsWith("http") ? src : `http://localhost:5000/uploads/${src}`;
  };

  const handleRefreshPosts = () => {
    dispatch(fetchPosts());
  };

  return (
    <>
      <Navbar />
      <div className="state-details-page pb-16">
        <header
          className="hero-banner"
          style={{ backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="hero-overlay-gradient" />
          <div className="relative z-10 w-full px-6 md:px-12 text-white max-w-7xl mx-auto">
            <p className="hero-eyebrow uppercase tracking-widest text-xs md:text-sm font-bold text-sky-300 drop-shadow">
              State guide • curated by locals
            </p>
            <h1 className="hero-title mt-2 text-white drop-shadow-md">
              {formattedState}
            </h1>
            <p className="hero-tagline max-w-3xl mt-4 drop-shadow">
              Handpicked experiences, photos, and stories curated by locals. Jump into a city to see what people love right now.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {tags.map((tag, idx) => (
                <span key={idx} className="vibe-badge">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex gap-4 mt-6 text-sm">
              <span className="stat-pill backdrop-blur">
                {totalPosts} {totalPosts === 1 ? "post" : "posts"}
              </span>
              <span className="stat-pill backdrop-blur">
                {totalCities} {totalCities === 1 ? "city" : "cities"}
              </span>
              <span className="stat-pill backdrop-blur">
                {guides.length} {guides.length === 1 ? "local guide" : "local guides"}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-12">
          {/* Static Places Section */}
          {spots.length > 0 && (
            <section className="glass-section space-y-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-sky-600 font-bold">Must-Visit spots</p>
                <h2 className="text-2xl font-extrabold text-slate-800">Evergreen spots locals swear by</h2>
              </div>
              <div className="places-grid">
                {spots.map((spot, idx) => (
                  <article key={idx} className="place-card">
                    <div className="place-img-wrap">
                      <img src={spot.image} alt={spot.title} />
                      <span className="place-badge">Evergreen</span>
                    </div>
                    <div className="place-info">
                      <h4>{spot.title}</h4>
                      <p>{spot.desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Cities Navigator Filter Section */}
          <section className="glass-section space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-sky-600 font-bold">Explore cities</p>
                <h2 className="text-2xl font-extrabold text-slate-800">Where the community is posting</h2>
              </div>
              <p className="text-sm text-slate-500 font-medium">Tap a city to filter posts</p>
            </div>

            {cities.length === 0 ? (
              <p className="text-slate-500 italic">No places found for this state yet.</p>
            ) : (
              <div className="city-pills-container">
                <button
                  onClick={() => setSelectedCity("")}
                  className={`city-pill-btn ${selectedCity === "" ? "active" : ""}`}
                >
                  All Cities
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`city-pill-btn ${city === selectedCity ? "active" : ""}`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Local Guides Section */}
          <section className="glass-section space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-sky-600 font-bold">Local Experts</p>
              <h2 className="text-2xl font-extrabold text-slate-800">Guides to show you around</h2>
            </div>

            {guidesLoading ? (
              <p className="text-slate-500 italic">Loading local guides...</p>
            ) : guides.length === 0 ? (
              <div className="empty-illustration">
                <p className="text-slate-500 italic">No local guides found for {formattedState} yet.</p>
              </div>
            ) : (
              <div className="guides-grid">
                {guides.map((g) => (
                  <Link
                    key={g._id}
                    className="guide-card-premium"
                    to={`/guide/${getGuideSlug(g)}`}
                  >
                    <div className="guide-avatar-wrap">
                      <img src={getGuideImage(g)} alt={g.name} />
                      <span className="guide-badge">Trusted</span>
                    </div>
                    <div className="guide-details">
                      <h4 className="guide-name">{g.name}</h4>
                      <p className="guide-loc">
                        {g.location?.city || formattedState}
                      </p>
                      <div className="guide-price-row">
                        <div>
                          <p className="guide-price-label">Price</p>
                          <p className="guide-price-val">
                            {g.price ? `Rs. ${Number(g.price).toLocaleString("en-IN")} / day` : "On request"}
                          </p>
                        </div>
                        <span className="guide-view-btn">View Profile</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Posts Grid Section */}
          <section className="glass-section space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-sky-600 font-bold">Community share</p>
                <h2 className="text-2xl font-extrabold text-slate-800">What locals are sharing</h2>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">
                Sorted by latest
              </span>
            </div>

            {loading ? (
              <p className="text-slate-500 italic">Loading posts...</p>
            ) : filteredByCity.length === 0 ? (
              <p className="text-slate-500 italic">No community posts found for this selection.</p>
            ) : (
              <div className="state-posts-grid">
                {filteredByCity.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    refreshPosts={handleRefreshPosts}
                    currentUser={user}
                    showMenu={user?._id === (post?.postedBy?._id || post?.user?._id)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
};

export default StateDetails;
