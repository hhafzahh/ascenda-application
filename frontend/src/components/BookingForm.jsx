import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BookingForm.css"; // create this CSS file

export default function BookingForm({ room, searchParams, hotel }) { // Added hotel prop
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+65"); // Fixed to Singapore default
  const [mobile, setMobile] = useState("");
  const [bookingForSomeone, setBookingForSomeone] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");
  
  // Loading state for better UX
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const bookingData = {
      title,
      firstName,
      lastName,
      email,
      countryCode,
      mobile,
      bookingForSomeone,
      room,
      searchParams,
      specialRequests,
      // Add hotel data to the booking
      hotel: hotel,
      hotelName: hotel?.name,
      hotelAddress: hotel?.address,
    };
    
    console.log('Submitting booking with room data:', room);
    console.log('Submitting booking with hotel data:', hotel);
    console.log('Full booking data:', bookingData);
    
    try {
      const res = await fetch("http://localhost:3002/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('Booking created successfully:', data);
      
      if (!data._id) {
        throw new Error('No booking ID returned from server');
      }
      
      // Pass hotel data through navigation state as backup
      navigate("/confirmation", { 
        state: { 
          bookingId: data._id,
          hotel: hotel // Pass hotel as backup
        } 
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="booking-container">
      <div className="booking-form-card">
        <div className="form-header">
          <h1>Complete Your Booking</h1>
          <p>Please fill in your details to continue with your reservation</p>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          
          {/* Personal Information Section */}
          <div className="form-section">
            <div className="section-title">
              Personal Information
            </div>
            <div className="form-grid three-column">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <select 
                  id="title"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  <option value="Mr">Mr.</option>
                  <option value="Ms">Ms.</option>
                  <option value="Mrs">Mrs.</option>
                  <option value="Dr">Dr.</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="form-section">
            <div className="section-title">
              Contact Details
            </div>
            <div className="form-grid two-column">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="mobile">Phone Number *</label>
                <div className="phone-group">
                  <select 
                    value={countryCode} 
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="country-code"
                  >
                    <option value="+65">+65 (SG)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+1">+1 (US)</option>
                  </select>
                  <input
                    type="tel"
                    id="mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="123-456-7890"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details Section */}
          <div className="form-section">
            <div className="section-title">
              Booking Details
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={bookingForSomeone}
                    onChange={(e) => setBookingForSomeone(e.target.checked)}
                    className="checkbox"
                  />
                  I am booking for someone else
                </label>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="specialRequests">Special Requests</label>
                <textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requirements, accessibility needs, or preferences..."
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              ← Back
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Processing...
                </>
              ) : (
                'Continue to Confirmation →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}