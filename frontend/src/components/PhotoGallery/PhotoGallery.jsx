import React, { useEffect, useState } from "react";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import "../PhotoGallery/PhotoGallery.css"; // Ensure you have styles for the gallery

export default function PhotoGallery({ hotel }) {
  const [images, setImages] = useState([]);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    if (!hotel || !hotel.image_details) return;

    const { prefix, suffix, count } = hotel.image_details;

    const galleryItems = Array.from({ length: count }).map((_, index) => ({
      original: `${prefix}${index}${suffix}`,
      thumbnail: `${prefix}${index}${suffix}`,
    }));

    setImages(galleryItems);
  }, [hotel]);

  if (!images.length) return null;

  return (
    <div className="hotel-photo-grid">
      {/* Left: Main Large Image */}
      <div className="main-image" onClick={() => setShowGallery(true)}>
        <img src={images[0].original} alt="Main Preview" />
      </div>

      {/* Right: 2x3 Grid */}
      <div className="side-grid">
        {images.slice(1, 7).map((img, i) => (
          <div
            className="grid-thumb"
            key={i}
            onClick={() => setShowGallery(true)}
          >
            <img src={img.original} alt={`Preview ${i + 1}`} />
            {i === 5 && <div className="overlay">See All Photos</div>}
          </div>
        ))}
      </div>

      {showGallery && (
      <div className="gallery-modal">
        <button className="close-btn" onClick={() => setShowGallery(false)}>
          ✕
        </button>
        <ImageGallery
          items={images}
          showPlayButton={false}
          showFullscreenButton={false}
          showThumbnails={true}
          showIndex={false}
          showBullets={false}
          onClick={() => setShowGallery(false)} // optional: if you want click-to-close
        />
      </div>
    )}

    </div>
  );
}
