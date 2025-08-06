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

  const overallAmenitiesScore = (ratings) => {
    if (!Array.isArray(ratings) || ratings.length === 0) return null;
    return +(ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length / 10).toFixed(1);
  };
  


  const getRatingLabel = (score) => {
      if (score >= 9.0) return "Excellent";
      if (score >= 8.0) return "Very Good";
      if (score >= 7.0) return "Good";
      if (score >= 5.0) return "Fair";
      if (score >= 2.0) return "Poor";
      return "Very Poor";
    };

  return (
    <div className="ratings-container">
      <div className="ratings-header" >
          <p className="rating-value" style={{ color: '#0268bbff', fontSize:'32px' }}>{overallAmenitiesScore(amenitiesRatings)} 
            <span style={{color: '#54b2ffff', fontSize:'18px'}}>/10</span></p>
          <div className='header-text'>
            <p className="rating-label" >{getRatingLabel(overallAmenitiesScore(amenitiesRatings))}</p>
            <p className='header-title'>How guests rated us</p>
          </div>
          
      </div>

      {amenitiesRatings.length > 0 && (
        // <div className="amenities-ratings-section">
          <div className="amenities-ratings-grid">
            {amenitiesRatings.map((item, index) => {
              const score = Math.min(10, Math.max(0, item.score/10));
              return (
                <div key={index} className="amenity-rating-item">
                  <p className="amenity-name" style={{textAlign: 'left'}}>{item.name}</p>
                  <div className="rating-bar-container">
                    <div className="rating-bar-background">
                      <div
                        className="rating-bar-fill"
                        style={{ width: `${score*10}%` }}
                      />
                    </div>
                    <span className="rating-score">{score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        // </div>
      )}
    </div>
  );
}
