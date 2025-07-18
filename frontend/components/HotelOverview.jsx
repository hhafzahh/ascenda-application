import React from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {FaStar, FaStarHalfAlt, FaRegStar} from 'react-icons/fa';
import { Tag } from 'primereact/tag';
import { Button } from '@mui/material';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Card } from 'primereact/card';
import 'primereact/resources/themes/saga-blue/theme.css';   // or another theme
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-blue/theme.css'; // or any other theme





     

export default function HotelOverview({onSelectRoom}) {
  const { hotelId } = useParams();
  const location = useLocation();
  const passedHotel = location.state?.hotel; // <- from Landing page

  const [hotel, setHotel] = useState(passedHotel || null);
  const [loading, setLoading] = useState(!passedHotel); // only load if we didn't receive hotel
  const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!passedHotel) {
//       const fetchHotelData = async () => {
//         try {
//           const res = await axios.get(`http://localhost:3001/api/hotelproxy/hotels/uid/${hotelId}`);
//           setHotel(res.data);
//         } catch (err) {
//           console.error('Error fetching hotel:', err);
//           setError('Failed to load hotel details.');
//         } finally {
//           setLoading(false);
//         }
//       };

//       fetchHotelData();
//     }
//   }, [hotelId, passedHotel]);

  if (loading) return <p>Loading hotel details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!hotel) return <p>No hotel data found.</p>;

  function splitDescription(text) {
    const distancesMarker = "Distances are displayed";
    const airportsMarker = "The nearest airports are:";

    const distancesIdx = text.indexOf(distancesMarker);
    const airportsIdx = text.indexOf(airportsMarker);

    let mainDescription = text;
    let nearbyAmenities = "";
    let nearestAirports = "";

    // Both distances and airports exist
    if (distancesIdx !== -1 && airportsIdx !== -1) {
        mainDescription =
        text.slice(0, distancesIdx).trim() +
        "\n\n" +
        text.slice(airportsIdx + text.slice(airportsIdx).indexOf("</p>") + 4).trim();

        nearbyAmenities = text.slice(distancesIdx, airportsIdx).trim();
        nearestAirports = text.slice(airportsIdx, airportsIdx + text.slice(airportsIdx).indexOf("</p>") + 4).trim();
    }
    // Only distances
    else if (distancesIdx !== -1) {
        mainDescription =
        text.slice(0, distancesIdx).trim() +
        "\n\n" +
        text.slice(distancesIdx + text.slice(distancesIdx).indexOf("</p>") + 4).trim();
        nearbyAmenities = text.slice(distancesIdx).trim();
    }
    // Only airports
    else if (airportsIdx !== -1) {
        mainDescription =
        text.slice(0, airportsIdx).trim() +
        "\n\n" +
        text.slice(airportsIdx + text.slice(airportsIdx).indexOf("</p>") + 4).trim();
        nearestAirports = text.slice(airportsIdx).trim();
    }

    return {
        //main: mainDescription.replace(/<[^>]*>/g, ''),
        main: mainDescription,
        nearby: nearbyAmenities,
        airports: nearestAirports,
    };
    }
  
  const { main, nearby, airports } = splitDescription(hotel.description);

  
    function hotelRating(rating) {
        const stars = [];

        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        for (let i = 0; i < fullStars; i++) {
            stars.push(<FaStar key={`full-${i}`} color="#FFD700" />);
        }

        if (hasHalfStar) {
            stars.push(<FaStarHalfAlt key="half" color="#FFD700" />);
        }

        for (let i = 0; i < emptyStars; i++) {
            stars.push(<FaRegStar key={`empty-${i}`} color="#FFD700" />);
        }

        return stars;
    }

  function findCategory(description) {
    const categories = {
        "Hotel": "Hotel",
        "Hostel": "Hostel",
        "Apartment": "Apartment",
        "Resort": "Resort",
        "Motel": "Motel",
        "Guest House": "Guest House",
        "Bed and Breakfast": "B&B",
    };


    for (const [key, value] of Object.entries(categories)) {
        if (description.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    return "Property";
  }

  const category = findCategory(hotel.description);

  function getAmenities(amenities) {
    if (!amenities || typeof amenities !== 'object') return [];

    return Object.entries(amenities)
        .filter(([_, value]) => value) // keep only true values
        .map(([key]) =>
        key
            .replace(/([A-Z])/g, ' $1')        // insert space before capital letters
            .replace(/^./, s => s.toUpperCase()) // capitalize first letter
        );
    }

  return (
    
    <div className="hotel-overview">
        <div className="hotel-header" style={{display: 'flex', flexDirection:'row', justifyContent: 'space-between', alignItems: 'center', gap: '1rem'}}>
            <div>
                <h2 className="text-2xl font-bold" style={{textAlign: 'left', margin: '0'}}>{hotel.name}</h2>
                <div className="hotel-rating" style={{display: 'flex', alignItems: 'center'}}>
                    <Tag  value={category} rounded style={{ padding: '0.2rem 0.8rem 0.2rem 0.8rem', marginRight: '0.5rem' }}></Tag>
                    {hotelRating(hotel.rating || 0)}
                </div>
            </div>
            <div>
                <Button
                    variant="contained"
                    sx={{
                        backgroundColor: '#FF6D3A',
                        '&:hover': {
                        backgroundColor: '#e6551f',
                        },
                        textTransform: 'none',
                        fontWeight: '600',
                    }}
                    onClick={onSelectRoom}
                    >
                    Select Room
                </Button>
            </div>
             
        </div>
        
        <p style={{textAlign: 'justify', marginTop: '0.5rem'}} dangerouslySetInnerHTML={{ __html: main }}/>
        

        
        
    <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', marginTop: '1rem' }}>
        {/* Nearby Amenities */}
        {nearby && (
        <Card className='padding-0'>
            <h3 className="text-lg font-semibold mb-2" style={{textAlign:'left'}}>In the area 📍</h3>
            
            <ScrollPanel style={{ width: '100%', height: '200px'  }}>
                <p style={{textAlign: 'left'}}>{hotel.address}</p>
                <div style={{textAlign:'left'}} dangerouslySetInnerHTML={{ __html: nearby }} />
            </ScrollPanel>
        </Card>
        )}

        {/* Nearest Airports */}
        {airports && (
        <Card>
            <h3 className="text-lg font-semibold mb-2" style={{textAlign:'left'}}>Nearest Airports</h3>
            <ScrollPanel style={{ width: '100%', height: '200px' }}>
                <div style={{textAlign:'left'}} dangerouslySetInnerHTML={{ __html: airports }} />
            </ScrollPanel>
        </Card>
        )}
    </div>




    </div>
    
    
  );
}
