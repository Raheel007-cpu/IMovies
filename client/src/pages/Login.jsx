import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, User } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!email || !password) {
      setFormError("Please enter both email and password");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo auto-fill helper
  const fillDemo = (role) => {
    if (role === "admin") {
      setEmail("admin@imovies.com");
      setPassword("adminpassword123");
    } else {
      setEmail("rahul@imovies.com");
      setPassword("userpassword123");
    }
    setFormError("");
  };

  return (
    <div style={{ maxWidth: "440px", margin: "2rem auto", padding: "0 1rem" }}>
      <div className="glass-card" style={{ padding: "2.25rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              border: "1px solid rgba(229, 9, 20, 0.3)",
            }}
          >
            <LogIn size={24} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Welcome Back</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Sign in to access your IMovies tickets & bookings
          </p>
        </div>

        {formError && (
          <div
            style={{
              padding: "0.85rem 1rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontSize: "0.85rem",
              color: "#fecaca",
            }}
          >
            <AlertCircle size={18} color="var(--danger)" style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "0.5rem",
              }}
            >
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={18}
                color="var(--text-muted)"
                style={{ position: "absolute", left: "14px", top: "13px" }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.6rem",
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  color: "#fff",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "0.5rem",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                color="var(--text-muted)"
                style={{ position: "absolute", left: "14px", top: "13px" }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.6rem",
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  color: "#fff",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.8rem", fontSize: "1rem" }}
          >
            <span>{isSubmitting ? "Signing in..." : "Sign In"}</span>
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div style={{ marginTop: "1.75rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Fast One-Click Demo Credentials
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <button
              type="button"
              onClick={() => fillDemo("customer")}
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "0.45rem" }}
            >
              <User size={14} color="var(--primary)" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo("admin")}
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "0.45rem" }}
            >
              <ShieldCheck size={14} color="var(--accent)" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

