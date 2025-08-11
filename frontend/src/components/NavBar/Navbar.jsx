// NavBar.jsx

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Navbar.css";

function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!sessionStorage.getItem("userId")
  );

  useEffect(() => {
    const updateLoginStatus = () => {
      setIsLoggedIn(!!sessionStorage.getItem("userId"));
    };

    window.addEventListener("storage", updateLoginStatus);
    window.addEventListener("custom-login-event", updateLoginStatus);

    return () => {
      window.removeEventListener("storage", updateLoginStatus);
      window.removeEventListener("custom-login-event", updateLoginStatus);
    };
  }, []);

  return (
    <nav className="navbar">
      <div>
        <Link to="/" className="logo">
          Ascenda
        </Link>
      </div>
      <div className="links-container">
        <Link to="/" className="link">
          Home
        </Link>
        {isLoggedIn && (
          <Link to="/my-bookings" className="link">
            My Bookings
          </Link>
        )}
        {isLoggedIn ? (
          <>
            <Link to="/profile" className="link profile">
              Profile
            </Link>

            <button
              className="logout-btn"
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="link login">
              Login
            </Link>
            <Link to="/register" className="link register">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
