import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Film, MapPin, User, LogIn, LogOut, ShieldCheck, ChevronDown, Ticket, Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCity } from "../../context/CityContext";
import { useTheme } from "../../context/ThemeContext";
import CityModal from "./CityModal";

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const { selectedCity } = useCity();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  return (
    <>
      <header
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-color)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            maxWidth: "var(--max-width)",
            margin: "0 auto",
            padding: "0.85rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.5rem",
          }}
        >
          {/* Brand Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #e50914 0%, #b20710 100%)",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(229, 9, 20, 0.4)",
              }}
            >
              <Film size={20} color="#fff" />
            </div>
            <div>
              <span style={{ fontSize: "1.35rem", fontWeight: "800", letterSpacing: "-0.02em" }}>
                I<span style={{ color: "var(--primary)" }}>MOVIES</span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                color: isActive ? "var(--primary)" : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "0.95rem",
              })}
            >
              Home
            </NavLink>
            <NavLink
              to="/movies"
              style={({ isActive }) => ({
                color: isActive ? "var(--primary)" : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "0.95rem",
              })}
            >
              Movies
            </NavLink>
            <NavLink
              to="/theatres"
              style={({ isActive }) => ({
                color: isActive ? "var(--primary)" : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "0.95rem",
              })}
            >
              Theatres
            </NavLink>
          </nav>

          {/* Right Action Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* City Selector Trigger Button */}
            <button
              onClick={() => setIsCityModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.4rem 0.85rem",
                backgroundColor: "var(--bg-card)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                fontSize: "0.85rem",
                color: "var(--text-primary)",
                fontWeight: 600,
              }}
            >
              <MapPin size={15} color="var(--primary)" />
              <span>{selectedCity}</span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>

            {/* Theme Mode Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDarkMode ? "Light" : "Dark"} Mode`}
              aria-label="Toggle Light and Dark Mode"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                color: isDarkMode ? "#f5c518" : "#f59e0b",
                cursor: "pointer",
                transition: "transform 0.2s ease, background-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="badge badge-primary"
                    style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.4rem 0.75rem", textDecoration: "none" }}
                    title="Open Admin Console"
                  >
                    <ShieldCheck size={14} />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <Link
                  to="/my-bookings"
                  className="btn btn-secondary"
                  style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem", gap: "0.4rem" }}
                  title="My Bookings & Tickets"
                >
                  <Ticket size={15} color="var(--primary)" />
                  <span>My Bookings</span>
                </Link>

                <Link
                  to="/profile"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.35rem 0.75rem",
                    backgroundColor: "var(--bg-hover)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name.split(" ")[0]}</span>
                </Link>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="btn btn-secondary"
                  style={{ padding: "0.45rem 0.65rem", fontSize: "0.8rem" }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary"
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* City Selection Modal */}
      <CityModal isOpen={isCityModalOpen} onClose={() => setIsCityModalOpen(false)} />
    </>
  );
};

export default Header;
