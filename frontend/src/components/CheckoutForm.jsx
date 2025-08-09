import React, { useState } from "react";
import { 
  useStripe, 
  useElements, 
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement
} from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";

export default function CheckoutForm({ booking }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return; // Stripe hasn't loaded yet
    }

    if (!cardholderName.trim()) {
      alert("Please enter the cardholder name");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch("http://localhost:3002/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(booking.room.converted_price * 100) || Math.round(booking.room.price * 100) }),
      });

      if (!res.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await res.json();
      
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: cardholderName,
            email: booking.email,
          },
        },
      });

      if (result.error) {
        alert("Payment failed: " + result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        alert("Payment successful!");
        // Navigate to success page or home
        navigate("/");
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate total amount
  const totalAmount = booking.room?.converted_price || booking.room?.price || 0;

  // Common element options for styling
  const elementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="booking-form-card">
      <div className="form-header">
        <h1>Payment Details</h1>
        <p>Complete your booking with secure payment</p>
      </div>
      
      <form onSubmit={handleSubmit} className="booking-form" style={{ padding: '30px' }}>
        <div className="form-section">
          <div className="section-title">
            Payment Information
          </div>
          
          <div className="form-grid">
            {/* Cardholder Name */}
            <div className="form-group full-width">
              <label>Cardholder Name *</label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Name as it appears on card"
                className="form-input"
                required
              />
            </div>

            {/* Card Number */}
            <div className="form-group full-width">
              <label>Card Number *</label>
              <div className="card-element-container">
                <CardNumberElement options={elementOptions} />
              </div>
            </div>

            {/* Expiry Date and CVV in same row */}
            <div className="form-grid two-column">
              <div className="form-group">
                <label>Expiry Date *</label>
                <div className="card-element-container">
                  <CardExpiryElement options={elementOptions} />
                </div>
              </div>

              <div className="form-group">
                <label>CVV *</label>
                <div className="card-element-container">
                  <CardCvcElement options={elementOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary Section */}
        <div className="form-section">
          <div className="section-title">
            Payment Summary
          </div>
          <div className="payment-summary">
            <div className="summary-row">
              <span>Guest:</span>
              <span>{booking.firstName} {booking.lastName}</span>
            </div>
            <div className="summary-row">
              <span>Room:</span>
              <span>{booking.room?.roomDescription || 'Selected Room'}</span>
            </div>
            <div className="summary-row">
              <span>Room Rate:</span>
              <span>
                {new Intl.NumberFormat("en-SG", {
                  style: "currency",
                  currency: "SGD",
                }).format(totalAmount)}
              </span>
            </div>
            <div className="summary-row total">
              <span><strong>Total Amount:</strong></span>
              <span><strong>
                {new Intl.NumberFormat("en-SG", {
                  style: "currency",
                  currency: "SGD",
                }).format(totalAmount)}
              </strong></span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={() => navigate(-1)}
            disabled={isProcessing}
          >
            ← Back
          </button>
          
          <button 
            type="submit"
            className="btn btn-primary" 
            disabled={!stripe || isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="loading-spinner"></span>
                Processing Payment...
              </>
            ) : (
              "Pay Now →"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}