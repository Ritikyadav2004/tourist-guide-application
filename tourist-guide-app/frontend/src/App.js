import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/App.css";

// Components
import Header from "./components/Header";
import HeroSlider from "./components/HeroSlider";
import CityChips from "./components/CityChips";
import TrustRow from "./components/TrustRow";
import TopGuides from "./components/TopGuides";
import HowItWorks from "./components/HowItWorks";
import BecomeGuide from "./components/BecomeGuide";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
import BookingModal from "./components/BookingModal";

// Real Backend/DB Data Fetching
import { getGuides } from "./services/api";

function App() {
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [activeTab, setActiveTab] = useState("home");
  const [selectedGuideForBooking, setSelectedGuideForBooking] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Real guide state fetched from DB
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  let navigate;
  try {
    navigate = useNavigate();
  } catch {
    navigate = null;
  }

  // Fetch guides from existing project API / Backend
  useEffect(() => {
    let isMounted = true;
    const fetchGuidesFromDB = async () => {
      try {
        setLoading(true);
        const data = await getGuides();
        const guideList = Array.isArray(data?.guides)
          ? data.guides
          : Array.isArray(data)
          ? data
          : [];

        if (isMounted) {
          setGuides(guideList);
          // If the first guide has a city, adapt initial selectedCity if desired
          if (guideList.length > 0 && guideList[0]?.location) {
            const loc = typeof guideList[0].location === "object"
              ? guideList[0].location.city
              : guideList[0].location;
            if (loc && loc !== "Location not provided") {
              setSelectedCity(loc);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load guides from API:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGuidesFromDB();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute available destination cities dynamically from database guides
  const availableCities = useMemo(() => {
    const defaultList = ["Delhi", "Goa", "Jaipur", "Manali", "Chandigarh", "Rishikesh"];
    const citySet = new Set(defaultList);

    guides.forEach((g) => {
      const loc = typeof g.location === "object" ? g.location?.city : g.location;
      if (loc && loc !== "Location not provided" && loc !== "Location not shared") {
        citySet.add(loc.trim());
      }
    });

    return Array.from(citySet);
  }, [guides]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    showToast(`📍 Showing top verified guides in ${city}`);
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm) return;
    setSelectedCity(searchTerm);
    showToast(`🔍 Searching guides for "${searchTerm}"`);

    const guidesElem = document.getElementById("top-guides");
    if (guidesElem) {
      guidesElem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleBookGuide = (guide) => {
    setSelectedGuideForBooking(guide);
  };

  const handleConfirmBooking = (bookingData) => {
    showToast(`🎉 Booking confirmed for ${bookingData.guide.name}!`);
  };

  const handleJoinGuide = () => {
    if (navigate) {
      navigate("/register");
    } else {
      showToast("🚀 Guide registration portal opened!");
    }
  };

  const handleProfileClick = () => {
    setActiveTab("profile");
  };

  return (
    <div className="gullyguide-app" id="gullyguide-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="gg-toast-notification" role="status">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header (Sticky Top, Location Dropdown, Profile Icon) */}
      <Header
        selectedCity={selectedCity}
        cities={availableCities}
        onSelectCity={handleCitySelect}
        onProfileClick={handleProfileClick}
      />

      <main className="gg-main-content">
        {activeTab === "home" ? (
          <>
            {/* 2. Hero Section (55vh–60vh, pure white search bar with destination, date & traveler count) */}
            <HeroSlider onSearch={handleSearch} />

            {/* 3. City Chips (Popular Destinations from DB) */}
            <CityChips
              selectedCity={selectedCity}
              cities={availableCities}
              onSelectCity={handleCitySelect}
            />

            {/* 4. Trust Row (16px padding, soft light-teal background, larger icons) */}
            <TrustRow />

            {/* 5. Top Guides in [City] (Real DB guides, 20px padding, 16px radius, clean rating row) */}
            <TopGuides
              selectedCity={selectedCity}
              guidesData={guides}
              onBookGuide={handleBookGuide}
            />

            {/* 6. How GullyGuide Works (Unboxed, circular icons, bold numbers, connecting line) */}
            <HowItWorks />

            {/* 7. Become a Guide Section (Subtle teal gradient, soft shadow, prominent CTA) */}
            <BecomeGuide onJoinClick={handleJoinGuide} />

            {/* 8. Footer */}
            <Footer />
          </>
        ) : activeTab === "explore" ? (
          <div className="gg-explore-view">
            <div className="gg-view-icon">🧭</div>
            <h2 className="gg-view-title">Explore India's Hidden Gems</h2>
            <p className="gg-view-desc">
              Community stories and state-by-state travel diaries will appear here in the upcoming Explore release!
            </p>
            <button
              type="button"
              className="gg-view-back-btn"
              onClick={() => setActiveTab("home")}
            >
              Back to Home Guides
            </button>
          </div>
        ) : activeTab === "bookings" ? (
          <div className="gg-bookings-view">
            <div className="gg-view-icon">📅</div>
            <h2 className="gg-view-title">My GullyGuide Bookings</h2>
            <p className="gg-view-desc">
              View your upcoming tours and connect directly with your scheduled local guide.
            </p>
            <button
              type="button"
              className="gg-view-back-btn"
              onClick={() => setActiveTab("home")}
            >
              Book Another Guide
            </button>
          </div>
        ) : activeTab === "chat" ? (
          <div className="gg-chat-view">
            <div className="gg-view-icon">💬</div>
            <h2 className="gg-view-title">Direct Guide Chat</h2>
            <p className="gg-view-desc">
              Connect instantly with your booked guides for meeting points and custom itinerary requests.
            </p>
            <button
              type="button"
              className="gg-view-back-btn"
              onClick={() => setActiveTab("home")}
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div className="gg-profile-view">
            <div className="gg-view-icon">👤</div>
            <h2 className="gg-view-title">Traveler Profile</h2>
            <p className="gg-view-desc">
              Manage your preferences, saved destinations, and verified identification for seamless bookings.
            </p>
            <button
              type="button"
              className="gg-view-back-btn"
              onClick={() => setActiveTab("home")}
            >
              Back to Home
            </button>
          </div>
        )}
      </main>

      {/* 9. Bottom Navigation (Fixed at bottom: Home | Explore | Bookings | Chat | Profile) */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 10. Quick 10-Second Booking Modal */}
      {selectedGuideForBooking && (
        <BookingModal
          guide={selectedGuideForBooking}
          onClose={() => setSelectedGuideForBooking(null)}
          onConfirmBooking={handleConfirmBooking}
        />
      )}
    </div>
  );
}

export default App;
