import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Phone, ShieldCheck, Calendar, Key, CheckCircle2, AlertCircle, Save } from "lucide-react";

const Profile = () => {
  const { user, updateProfile, isAdmin } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });

    if (password && password.length < 6) {
      setStatusMessage({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }

    if (password && password !== confirmPassword) {
      setStatusMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setIsUpdating(true);
    try {
      const payload = { name, phone };
      if (password) {
        payload.password = password;
      }
      await updateProfile(payload);
      setPassword("");
      setConfirmPassword("");
      setStatusMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "1.5rem auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>Account Profile</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Manage your personal details and security settings
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.75rem" }}>
        {/* Profile Summary Card */}
        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #e50914 0%, #8b0000 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "#fff",
                boxShadow: "var(--shadow-md)",
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>{user?.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                <span className={`badge ${isAdmin ? "badge-primary" : "badge-success"}`}>
                  {isAdmin ? "Administrator" : "Customer"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              <Mail size={18} color="var(--primary)" />
              <span>{user?.email}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              <Phone size={18} color="var(--primary)" />
              <span>{user?.phone || "No phone provided"}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              <ShieldCheck size={18} color="var(--primary)" />
              <span>User ID: <code style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{user?._id}</code></span>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1.25rem" }}>
            Update Profile Information
          </h3>

          {statusMessage.text && (
            <div
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: statusMessage.type === "success" ? "var(--success-bg)" : "rgba(239, 68, 68, 0.12)",
                border: `1px solid ${statusMessage.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                borderRadius: "var(--radius-md)",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                fontSize: "0.85rem",
                color: statusMessage.type === "success" ? "var(--success)" : "#fecaca",
              }}
            >
              {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdate}>
            <div style={{ marginBottom: "1.1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  color: "#fff",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91..."
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  color: "#fff",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                New Password (Leave blank to keep unchanged)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  color: "#fff",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            {password && (
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    color: "#fff",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdating}
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.7rem", fontSize: "0.95rem" }}
            >
              <Save size={16} />
              <span>{isUpdating ? "Saving..." : "Save Changes"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

