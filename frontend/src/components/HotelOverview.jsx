import React from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { Tag } from 'primereact/tag';
import { Button } from '@mui/material';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Card } from 'primereact/card';
import MiniMap from "./MiniMap";
import PhotoGallery from './PhotoGallery/PhotoGallery';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-blue/theme.css';

export default function HotelOverview({ hotel: propHotel, onSelectRoom }) {
  const { hotelId } = useParams();
  const location = useLocation();
  const passedHotel = propHotel || location.state?.hotel;
  const searchParams = location.state?.searchParams;
  const fromBooking = location.state?.fromBooking;

  const [hotel, setHotel] = useState(passedHotel || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('HotelOverview - Hotel ID:', hotelId);
  console.log('HotelOverview - From booking:', fromBooking);
  console.log('HotelOverview - Search params:', searchParams);

  
  useEffect(() => {
    if ((fromBooking || !hotel) && hotelId && searchParams?.destinationId) {
      console.log('Fetching FULL hotel data for booking hotel ID:', hotelId);
      setLoading(true);
      
      
      const guestString = Array(searchParams.rooms || 1)
        .fill((searchParams.guests || 2))
        .join("|");
      
      
      axios.get(`http://localhost:3001/api/hotelproxy/hotels/uid/${searchParams.destinationId}`, {
        params: {
          checkin: searchParams.checkIn || searchParams.checkin,
          checkout: searchParams.checkOut || searchParams.checkout,
          guests: guestString,
        },
      })
        .then(response => {
          console.log('Fetched full hotels data:', response.data);
          const hotelsList = Array.isArray(response.data) ? response.data : response.data.hotels || [];
          const foundHotel = hotelsList.find(h => h.id === hotelId);
          if (foundHotel) {
            console.log('Found rich hotel data:', foundHotel);
            setHotel(foundHotel);
          } else {
            setError('Hotel not found in search results');
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching full hotel data:', err);
          
          tryDirectHotelAPI();
        });
    } else if (!hotel && hotelId) {
      
      tryDirectHotelAPI();
    }
  }, [hotelId, fromBooking, searchParams]);

  const tryDirectHotelAPI = () => {
    console.log('Trying direct hotel API for ID:', hotelId);
    setLoading(true);
    
    axios.get(`http://localhost:3001/api/hotelproxy/hotels/uid/${hotelId}`)
      .then(response => {
        console.log('Fetched hotel from direct API:', response.data);
        const hotelData = Array.isArray(response.data) ? response.data[0] : response.data;
        setHotel(hotelData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Direct API failed:', err);
        setError('Failed to load hotel details');
        setLoading(false);
      });
  };

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

    if (distancesIdx !== -1 && airportsIdx !== -1) {
      mainDescription =
        text.slice(0, distancesIdx).trim() +
        "\n\n" +
        text.slice(airportsIdx + text.slice(airportsIdx).indexOf("</p>") + 4).trim();

      nearbyAmenities = text.slice(distancesIdx, airportsIdx).trim();
      nearestAirports = text.slice(airportsIdx, airportsIdx + text.slice(airportsIdx).indexOf("</p>") + 4).trim();
    } else if (distancesIdx !== -1) {
      mainDescription =
        text.slice(0, distancesIdx).trim() +
        "\n\n" +
        text.slice(distancesIdx + text.slice(distancesIdx).indexOf("</p>") + 4).trim();
      nearbyAmenities = text.slice(distancesIdx).trim();
    } else if (airportsIdx !== -1) {
      mainDescription =
        text.slice(0, airportsIdx).trim() +
        "\n\n" +
        text.slice(airportsIdx + text.slice(airportsIdx).indexOf("</p>") + 4).trim();
      nearestAirports = text.slice(airportsIdx).trim();
    }

    return {
      main: mainDescription,
      nearby: nearbyAmenities,
      airports: nearestAirports,
    };
  }

  const { main, nearby, airports } = splitDescription(hotel.description || "No description available");

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

  const category = findCategory(hotel.description || "");

  function getAmenities(amenities) {
    if (!amenities || typeof amenities !== 'object') return [];

    return Object.entries(amenities)
      .filter(([_, value]) => value)
      .map(([key]) =>
        key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
      );
  }

  return (
    <div className="hotel-overview">
      <div className="hotel-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, textAlign: 'left' }}>
          <h2 className="text-2xl font-bold" style={{ textAlign: 'left', margin: '0' }}>{hotel.name || 'Hotel Name'}</h2>
          <div className="hotel-rating" style={{ display: 'flex', alignItems: 'center' }}>
            <Tag value={category} rounded style={{ padding: '0.2rem 0.8rem', marginRight: '0.5rem' }}></Tag>
            {hotelRating(hotel.rating || 0)}
          </div>
        </div>
        <div>
          {onSelectRoom && (
            <Button
              variant="contained"
              sx={{ backgroundColor: '#FF6D3A', '&:hover': { backgroundColor: '#e6551f' }, textTransform: 'none', fontWeight: '600' }}
              onClick={onSelectRoom}
            >
              Select Room
            </Button>
          )}
        </div>
      </div>

      {/* Photo Gallery */}
      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <PhotoGallery hotel={hotel} />
      </div>

      <p style={{ textAlign: 'justify', marginTop: '0.5rem' }} dangerouslySetInnerHTML={{ __html: main }} />

      <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', marginTop: '1rem' }}>
        {/* In the area */}
        {nearby && (
          <Card style={{ flex: 1 }}>
            <h3 style={{ textAlign: 'left' }}>In the area 📍</h3>
            <ScrollPanel style={{ width: '100%', height: '200px' }}>
              <p style={{ textAlign: 'left' }}>{hotel.address || 'Address not available'}</p>
              <div style={{ textAlign: 'left' }} dangerouslySetInnerHTML={{ __html: nearby }} />
            </ScrollPanel>
          </Card>
        )}

        {/* Nearest Airports */}
        {airports && (
          <Card style={{ flex: 1 }}>
            <h3 style={{ textAlign: 'left' }}>Nearest Airports</h3>
            <ScrollPanel style={{ width: '100%', height: '200px' }}>
              <div style={{ textAlign: 'left' }} dangerouslySetInnerHTML={{ __html: airports }} />
            </ScrollPanel>
          </Card>
        )}

        {/* Map View */}
        {hotel.latitude && hotel.longitude && (
          <Card style={{ flex: 1 }}>
            <h3 style={{ textAlign: 'left' }}>Map View</h3>
            <div style={{ height: '200px', width: '100%' }}>
              <MiniMap
                lat={hotel.latitude}
                lng={hotel.longitude}
                hotelName={hotel.name}
                price={hotel.price}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
