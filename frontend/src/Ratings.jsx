import React from 'react';
import './Ratings.css';

export default function Ratings({ hotel }) {
  if (!hotel) return null;

  const rating = hotel?.rating || 0;
  const amenitiesRatings = hotel?.amenities_ratings || [];

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="star full">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">★</span>);
    }

    return stars;
  };

  return (
    <div className="ratings-container">
      <div className="ratings-header">
        <h2 className="rating-value">{rating.toFixed(1)}</h2>
        <div className="star-rating">
          {renderStars()}
          <span className="rating-text">{rating.toFixed(1)}-star hotel</span>
        </div>
      </div>

      {amenitiesRatings.length > 0 && (
        <div className="amenities-ratings-section">
          <h3>Guest Ratings</h3>
          <div className="amenities-ratings-grid">
            {amenitiesRatings.map((item, index) => {
              const score = Math.min(100, Math.max(0, item.score));
              return (
                <div key={index} className="amenity-rating-item">
                  <div className="amenity-name">{item.name}</div>
                  <div className="rating-bar-container">
                    <div className="rating-bar-background">
                      <div
                        className="rating-bar-fill"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="rating-score">{score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
