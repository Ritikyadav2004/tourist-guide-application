import { useState } from "react";
import toast from "react-hot-toast";
import { createPost } from "../../services/api";
import "./CreatePost.css";
import { playNotificationSound } from "../../utils/playSound";

const CreatePost = ({ refreshPosts, onClose }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [maxGroupSize, setMaxGroupSize] = useState("");
  const [photoFile, setPhotoFile] = useState(null);

  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);



  const handleImage = (file) => {
    if (!file) return;
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !body || price === "" || !photoFile || !city || !stateValue) {
      playNotificationSound("error");
      toast.error("Please provide title, description, price, photo, and location", {
        duration: 3000,
        style: {
          border: "1.5px solid #ef4444",
          padding: '16px',
          color: '#b91c1c',
          fontWeight: 700,
        },
      });
      return;
    }

    setLoading(true);

    try {
      const locationObj = {
        city,
        state: stateValue,
        coordinates:
          latitude && longitude
            ? {
                latitude: Number(latitude),
                longitude: Number(longitude),
              }
            : undefined,
      };

      const res = await createPost({
        title,
        body,
        price,
        photoFile,
        location: JSON.stringify(locationObj),
        duration: duration || undefined,
        maxGroupSize: maxGroupSize ? Number(maxGroupSize) : undefined,
      });

      if (res && (res.post || res.success)) {
        setTitle("");
        setBody("");
        setPrice("");
        setDuration("");
        setMaxGroupSize("");
        setPhotoFile(null);

        setCity("");
        setStateValue("");
        setLatitude("");
        setLongitude("");

        setPreview(null);

        if (refreshPosts) refreshPosts();
        if (onClose) onClose();

        playNotificationSound("success");
        toast.success("Post created successfully!", {
          duration: 3000,
          style: {
            border: "1.5px solid #10b981",
            padding: '16px',
            color: '#0f172a',
            fontWeight: 700,
          },
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        });
      } else {
        playNotificationSound("error");
        toast.error(res?.message || res?.error || "Unable to create post", {
          duration: 3000,
          style: {
            border: "1.5px solid #ef4444",
            padding: '16px',
            color: '#b91c1c',
            fontWeight: 700,
          },
        });
      }
    } catch (err) {
      console.error(err);
      playNotificationSound("error");
      toast.error("Failed to create post. Please try again.", {
        duration: 3000,
        style: {
          border: "1.5px solid #ef4444",
          padding: '16px',
          color: '#b91c1c',
          fontWeight: 700,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post">
      <form onSubmit={handleSubmit} className="create-post-form">

        <h2 className="form-title">Create a New Post</h2>

        <div className="form-grid">

          <div className="form-left">

            <label className="label">Post Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label className="label">Post Body</label>
            <textarea
              placeholder="Write something interesting..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />

            <label className="label">Price</label>
            <input
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <label className="label">Trip Duration</label>
            <input
              type="text"
              placeholder="e.g. Full Day, 4 hours, 2 Days"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />

            <label className="label">Max Group Size</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 6"
              value={maxGroupSize}
              onChange={(e) => setMaxGroupSize(e.target.value)}
            />

            <label className="label">Upload Photo</label>

            <div className="file-row">
              <label className="choose-file">
                Choose File

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImage(e.target.files[0])}
                  hidden
                />
              </label>

              <span className="file-name">
                {photoFile ? photoFile.name : "No file chosen"}
              </span>
            </div>

            <hr className="divider" />

            <div className="location-header">📍 Add Your Location</div>

            <div className="location-grid">

              <div>
                <label className="small-label">City</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div>
                <label className="small-label">State</label>

                <select
                  value={stateValue}
                  onChange={(e) => setStateValue(e.target.value)}
                >
                  <option value="">Select state</option>
                  <option>Delhi</option>
                  <option>Maharashtra</option>
                  <option>Uttar Pradesh</option>
                  <option>Karnataka</option>
                  <option>West Bengal</option>
                  <option>Tamil Nadu</option>
                  <option>Rajasthan</option>
                  <option>Gujarat</option>
                  <option>Kerala</option>
                </select>
              </div>

              <div className="coord-row">

                <div>
                  <label className="small-label">Latitude</label>
                  <input
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>

                <div>
                  <label className="small-label">Longitude</label>
                  <input
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>

              </div>

              <button
                type="button"
                className="my-location"
                onClick={() => {
                  if (!navigator.geolocation) {
                    playNotificationSound("error");
                    toast.error("Geolocation not supported", {
                      duration: 3000,
                      style: {
                        border: "1.5px solid #ef4444",
                        padding: '16px',
                        color: '#b91c1c',
                        fontWeight: 700,
                      },
                    });
                    return;
                  }

                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setLatitude(String(pos.coords.latitude));
                      setLongitude(String(pos.coords.longitude));
                    },
                    (err) => {
                      console.error(err);
                      playNotificationSound("error");
                      toast.error("Unable to get location", {
                        duration: 3000,
                        style: {
                          border: "1.5px solid #ef4444",
                          padding: '16px',
                          color: '#b91c1c',
                          fontWeight: 700,
                        },
                      });
                    },
                    { enableHighAccuracy: true }
                  );
                }}
              >
                Use My Current Location
              </button>

            </div>

            <div className="actions-row">

              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-btn"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Post"}
              </button>

            </div>

          </div>

          <div className="form-right">

            <div className="map-box">

              {latitude && longitude ? (
                <img
                  src={`https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=13&size=520x380&markers=${latitude},${longitude},red-pushpin`}
                  alt="map"
                />
              ) : (
                <div className="map-placeholder">
                  Map preview will appear here
                </div>
              )}

            </div>

          </div>

        </div>

      </form>
    </div>
  );
};

export default CreatePost;