import React from 'react';
import './Amenities.css';
import FmdGoodIcon from '@mui/icons-material/FmdGood';

export default function Amenities({ nearbyAmenities, address}) {
    function extractDistancesInKm(nearbyAmenities) {
        if (!nearbyAmenities || nearbyAmenities.length === 0) {
            return "No information available";
        }

        const results = [];
        const regex = /([\w\s'().,-]+?)\s*-\s*([\d.]+)\s*km\s*\/\s*[\d.]+\s*mi/g;

        let match;
        while ((match = regex.exec(nearbyAmenities)) !== null) {
            const place = match[1].trim();
            const distanceKm = match[2].trim();
            results.push({ [place]: distanceKm });
        }

        return results;
        }

    const distances = extractDistancesInKm(nearbyAmenities);
    
    return (
        <div className="amenities-container">
            <div className="amenities-header" >
                
                <div className='header-text'>
                    <p className='header-title'>In the area</p>
                    {address && (
                    <p className="address">
                        <span className="address-icon-wrapper">
                            <FmdGoodIcon className="address-icon" />
                        </span>
                        {address}
                    </p>
                    )}
                </div>
                
            </div>

            {Array.isArray(distances) && distances.length > 0 ? (
                <div className="nearby-amenities-list">
                    {distances.map((item, idx) => {
                    const [place, distance] = Object.entries(item)[0];
                    return (
                        <div className="amenity-row" key={idx}>
                        <div className="amenity-left">
                            <FmdGoodIcon className="location-icon" />
                            <span className="place-name">{place}</span>
                        </div>
                        <div className="amenity-distance">{distance} km</div>
                        </div>
                    );
                    })}
                </div>
                ) : (
                <div className="amenities-empty" aria-live="polite">
                    No information available
                </div>
                )}


        </div>
        );
}