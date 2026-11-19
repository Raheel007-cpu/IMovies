import React from "react";
import { Link } from "react-router-dom";
import { Home as HomeIcon } from "lucide-react";

const NotFound = () => {
  return (
    <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <h1 style={{ fontSize: "5rem", fontWeight: 800, color: "var(--primary)" }}>404</h1>
      <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>Page Not Found</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">
        <HomeIcon size={18} />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};

export default NotFound;

