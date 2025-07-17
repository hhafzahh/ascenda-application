import { Link } from "react-router-dom";

function NavBar() {
  const styles = {
    navbar: {
      backgroundColor: "#ffffff",
      padding: "1rem 2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid #e5e7eb",
      flexWrap: "wrap", // To help with responsiveness
    },
    logo: {
      fontSize: "1.5rem",
      fontWeight: 700,
      textDecoration: "none",
      color: "#1f2937",
    },
    linksContainer: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      flexWrap: "wrap",
    },
    link: {
      fontSize: "0.95rem",
      color: "#111827",
      textDecoration: "none",
      fontWeight: 500,
      padding: "0.4rem 0.8rem",
      borderRadius: "0.375rem",
      transition: "all 0.2s ease-in-out",
    },
    loginLink: {
      border: "1px solid #3b82f6",
      color: "#3b82f6",
    },
    loginLinkHover: {
      backgroundColor: "#eff6ff",
    },
    registerLink: {
      backgroundColor: "#3b82f6",
      color: "#ffffff",
    },
    registerLinkHover: {
      backgroundColor: "#2563eb",
    },
  };

  return (
    <nav style={styles.navbar}>
      <div>
        <Link to="/" style={styles.logo}>
          Ascenda
        </Link>
      </div>
      <div style={styles.linksContainer}>
        <Link to="/" style={styles.link}>
          Home
        </Link>
        <Link
          to="/login"
          style={{ ...styles.link, ...styles.loginLink }}
          onMouseEnter={(e) =>
            (e.target.style.backgroundColor =
              styles.loginLinkHover.backgroundColor)
          }
          onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
        >
          Login
        </Link>
        <Link
          to="/register"
          style={{ ...styles.link, ...styles.registerLink }} //shared base style + register link style
          onMouseEnter={(e) =>
            (e.target.style.backgroundColor =
              styles.registerLinkHover.backgroundColor)
          }
          onMouseLeave={(e) =>
            (e.target.style.backgroundColor =
              styles.registerLink.backgroundColor)
          }
        >
          Register
        </Link>
      </div>
    </nav>
  );
}

export default NavBar;
