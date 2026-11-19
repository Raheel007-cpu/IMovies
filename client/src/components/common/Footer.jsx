import React from "react";
import { Film } from "lucide-react";

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: "var(--bg-secondary)",
      borderTop: "1px solid var(--border-color)",
      padding: "2.5rem 1.5rem",
      marginTop: "auto",
      color: "var(--text-secondary)",
      fontSize: "0.875rem"
    }}>
      <div style={{
        maxWidth: "var(--max-width)",
        margin: "0 auto",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Film size={18} color="var(--primary)" />
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>IMovies</span>
          <span>— Movie ticket booking made simple.</span>
        </div>
        <p>© {new Date().getFullYear()} IMovies Platform. Designed for Vercel & MongoDB Atlas.</p>
      </div>
    </footer>
  );
};

export default Footer;

