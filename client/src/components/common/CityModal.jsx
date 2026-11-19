import React from "react";
import { useCity } from "../../context/CityContext";
import { MapPin, X, Check } from "lucide-react";

const CityModal = ({ isOpen, onClose }) => {
  const { cities, selectedCity, changeCity } = useCity();

  if (!isOpen) return null;

  const handleSelect = (cityName) => {
    changeCity(cityName);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "2rem",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MapPin size={22} color="var(--primary)" />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Choose Your City</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              color: "var(--text-secondary)",
              padding: "0.25rem",
              borderRadius: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
          Select a city to discover theatres, movies, and live showtimes near you
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {cities.map((city) => {
            const isSelected = city.name.toLowerCase() === selectedCity.toLowerCase();
            return (
              <button
                key={city._id}
                onClick={() => handleSelect(city.name)}
                style={{
                  padding: "0.85rem 1rem",
                  backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-secondary)",
                  border: `1px solid ${isSelected ? "var(--primary)" : "var(--border-color)"}`,
                  borderRadius: "var(--radius-md)",
                  color: isSelected ? "#fff" : "var(--text-primary)",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                }}
              >
                <span>{city.name}</span>
                {isSelected && <Check size={18} color="var(--primary)" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CityModal;

