import Minimap from "../Minimap";
import React from "react";
import "./Map.css";

export default function Map({ lat, lng, hotelName, price }) {
    console.log("Map component rendered with lat:", lat, "lng:", lng, "hotelName:", hotelName, "price:", price);

    return (
        <div className="map-container">
            <div className="map-header" >
                <div className='header-text'>
                    <p className='header-title'>On the map</p>
                    <p className='subtitle'>See where we're located</p>
                </div>
            </div>
            <div className="map-content">
                <Minimap 
                    lat={lat} 
                    lng={lng}
                    hotelName={hotelName}
                    price={price} 
                    style={{ width: '100%', height: '200px' }}
                />
            </div>
        </div>
    
    )
}