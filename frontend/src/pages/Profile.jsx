import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/Profile.css";

export default function Profile({  onLogout, onCancel = () => window.location.reload() } ) {
  const [user, setUser] = useState({
    name: "",
    email: "",
  });
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const userId = sessionStorage.getItem("userId");

  console.log(userId)
  useEffect(() => {
    axios.get(`http://localhost:3004/api/user/${userId}`).then((res) => {
        const { username, email, dob } = res.data;
        console.log(res.data)
        setUser({
          name: username,
          email,
          dob: dob || ""
        });
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
      });
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    axios.put(`http://localhost:3004/api/user/${userId}`, {
      username: user.name,
      dob: user.dob
    })
      .then(() => {
        alert("Profile updated successfully!");
      })
      .catch((err) => {
        console.error("Failed to update profile:", err);
        alert("Error updating profile.");
      });
  };

  const handlePasswordSubmit = () => {
    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    axios.put(`http://localhost:3004/api/user/${userId}/password`, passwordFields)
      .then(() => {
        alert("Password updated successfully!");
        setPasswordFields({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowPasswordSection(false);
      })
      .catch((err) => {
        console.error("Password update failed:", err);
        alert(err.response?.data?.error || "Failed to update password");
      });
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Account Settings</h2>

        <div className="profile-info">
          <div className="name-section">
            <label>Full Name</label>
            <input name="name" value={user.name} onChange={handleChange} />
          </div>

          <label>Email Address</label>
          <input name="email" value={user.email} disabled />


          <button className="change-password-toggle" 
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  style={{backgroundColor: "transparent",
                          color: "#4000ffff",
                          border: "none",
                          cursor: "pointer",
                          margin: "0.5rem 0"
                
                  }}>
            {showPasswordSection ? "Cancel Password Change" : "Change Password"}
          </button>

          {showPasswordSection && (
            <div className="password-section">
              <h3>Change Password</h3>

              <label>Current Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="currentPassword"
                value={passwordFields.currentPassword}
                onChange={handlePasswordChange}
              />

              <label>New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                value={passwordFields.newPassword}
                onChange={handlePasswordChange}
              />

              <label>Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={passwordFields.confirmPassword}
                onChange={handlePasswordChange}
              />

              <label>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                /> Show Passwords
              </label>

              <button className="save-btn" onClick={handlePasswordSubmit}>
                Update Password
              </button>
            </div>
          )}
        </div>

        <div className="delete-section">
          <a
            className="delete-link"
            onClick={async () => {
              if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;

              try {
                await axios.delete(`http://localhost:3004/api/user/${userId}`);
                sessionStorage.clear();
                alert("Account deleted successfully.");
                window.location.href = "/";
              } catch (err) {
                console.error("Failed to delete account:", err);
                alert("Error deleting account.");
              }
            }}
          >
            Delete Your Account
          </a>

          <p className="delete-description">
            Deleting your account will remove all your data permanently.
          </p>
        </div>

        <div className="button-group">
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

