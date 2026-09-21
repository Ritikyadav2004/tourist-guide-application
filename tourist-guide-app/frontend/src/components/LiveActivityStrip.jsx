import { useEffect, useState } from "react";
import { getPosts, getGuides } from "../services/api";
import "./LiveActivityStrip.css";

const LiveActivityStrip = () => {
  const [activities, setActivities] = useState([
    "🔥 Someone booked a trip to Goa 2 hours ago",
    "⭐ Sara Khan received a 5-star review from a verified traveler",
    "📍 New guide registered in Jaipur 1 hour ago",
    "🔥 Aarav Mehta from Delhi was booked for a Himalayan tour",
    "⚡ 14 travelers are planning trips to India right now",
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeState, setFadeState] = useState("fade-in");

  useEffect(() => {
    const loadRealData = async () => {
      try {
        const postsRes = await getPosts(1, 5);
        const guidesRes = await getGuides();
        
        const realActivities = [];
        
        if (postsRes?.posts && postsRes.posts.length > 0) {
          postsRes.posts.slice(0, 3).forEach((post) => {
            const author = post.author?.name || "A traveler";
            const title = post.title || "an amazing destination";
            const city = post.location?.city || post.location || "";
            const locationStr = city ? ` in ${city}` : "";
            realActivities.push(`✨ ${author} shared a new story: "${title}"${locationStr}`);
          });
        }
        
        const guidesList = Array.isArray(guidesRes) ? guidesRes : guidesRes?.guides;
        if (guidesList && guidesList.length > 0) {
          guidesList.slice(0, 3).forEach((guide) => {
            const name = guide.name;
            const city = guide.location?.city || guide.location || "";
            const locStr = city ? ` in ${city}` : "";
            realActivities.push(`🔥 Verified Guide ${name} is available for booking${locStr}`);
          });
        }
        
        if (realActivities.length > 0) {
          setActivities((prev) => {
            const combined = [...realActivities, ...prev];
            return Array.from(new Set(combined));
          });
        }
      } catch (err) {
        console.warn("Failed to load real data for activities, using default fallbacks.", err);
      }
    };
    
    loadRealData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFadeState("fade-out");
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activities.length);
        setFadeState("fade-in");
      }, 500);
    }, 4500);

    return () => clearInterval(timer);
  }, [activities.length]);

  return (
    <div className="live-activity-strip" aria-live="polite">
      <div className="activity-container">
        <span className="live-badge">LIVE</span>
        <div className={`activity-text ${fadeState}`}>
          {activities[currentIndex]}
        </div>
      </div>
    </div>
  );
};

export default LiveActivityStrip;
