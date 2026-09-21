import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Carasol.css";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
    title: "DISCOVER THE UNSEEN",
    subtitle: "Himalayan Escapes",
  },
  {
    image:
      "https://plus.unsplash.com/premium_photo-1697729701846-e34563b06d47?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dG91ciUyMGdvYXxlbnwwfHwwfHx8MA%3D%3D",
    title: "ESCAPE THE ORDINARY",
    subtitle: "Goa Vibes",
  },
  
  {
    image:
      "https://images.unsplash.com/photo-1587135941948-670b381f08ce?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dGFqJTIwbWFoYWx8ZW58MHx8MHx8fDA%3D",
    title: "Taj Mahal",
    subtitle: "Experience the beauty of India's greatest wonder",
  },
];

const Carasol = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === slides.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchVal(params.get("search") || "");
  }, [location.search]);

  const nextSlide = () => {
    setCurrentIndex(
      currentIndex === slides.length - 1 ? 0 : currentIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex(
      currentIndex === 0 ? slides.length - 1 : currentIndex - 1
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const currentPath = location.pathname;
    if (searchVal.trim()) {
      navigate(`${currentPath}?search=${encodeURIComponent(searchVal.trim())}`);
    } else {
      navigate(currentPath);
    }
    
    // Scroll to guides section
    setTimeout(() => {
      const guidesEl = document.getElementById("guides");
      if (guidesEl) {
        guidesEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className="carousel">
      <img
        src={slides[currentIndex].image}
        alt="Travel"
        className="carousel-image"
      />

      {/* Dark Overlay */}
      <div className="carousel-dark"></div>

      {/* Center Content */}
      <div className="carousel-content">
        <div className="trending-badge-container">
          <span className="trending-badge">TRENDING DESTINATION</span>
        </div>
        <h1>{slides[currentIndex].title}</h1>
        <p>{slides[currentIndex].subtitle}</p>

        {/* Premium search bar */}
        <form onSubmit={handleSearchSubmit} className="hero-search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Where do you want to go? (e.g. Goa, Himalayan)"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </div>
          <button type="submit">Search</button>
        </form>
      </div>

      {/* Arrows */}
      <button className="prev-btn" onClick={prevSlide} aria-label="Previous slide">
        ‹
      </button>
      <button className="next-btn" onClick={nextSlide} aria-label="Next slide">
        ›
      </button>

      {/* Dots */}
      <div className="dots">
        {slides.map((_, index) => (
          <span
            key={index}
            className={`dot ${
              currentIndex === index ? "active" : ""
            }`}
            onClick={() => setCurrentIndex(index)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default Carasol;


