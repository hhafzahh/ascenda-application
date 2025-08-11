import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BookingCard from "../components/BookingCard";
import "./MyBookings.css";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const userId = sessionStorage.getItem("userId");
        console.log("MyBookings: Fetching bookings for userId:", userId);
        
        if (!userId) {
          console.log("MyBookings: No userId found, redirecting to login");
          navigate("/login");
          return;
        }

        const url = `http://localhost:3002/api/bookings/user/${userId}`;
        console.log("MyBookings: Fetching from:", url);
        
        const response = await fetch(url);
        console.log("MyBookings: Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("MyBookings: Error response:", errorText);
          throw new Error(`Failed to fetch bookings: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("MyBookings: Received data:", data);
        console.log("MyBookings: Number of bookings:", data.length);
        
        setBookings(data);
      } catch (err) {
        console.error("MyBookings: Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [navigate]);

  if (loading) return <div className="loading">Loading your bookings...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="my-bookings-container">
      <h1>My Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>You haven't made any bookings yet.</p>
          <button onClick={() => navigate("/")}>Find Hotels</button>
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings.map(booking => (
            <BookingCard key={booking._id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}