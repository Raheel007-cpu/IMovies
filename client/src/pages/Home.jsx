import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Film,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Database,
  Globe,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import API from "../services/api";
import HeroBanner from "../components/movie/HeroBanner";
import MovieCard from "../components/movie/MovieCard";

const Home = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [nowShowing, setNowShowing] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);

  const [healthData, setHealthData] = useState(null);
  const [pingData, setPingData] = useState(null);
  const [seedData, setSeedData] = useState(null);
  const [diagLoading, setDiagLoading] = useState(true);

  // Fetch movies for home page
  useEffect(() => {
    const loadHomeData = async () => {
      setMoviesLoading(true);
      try {
        const [featuredRes, nowShowingRes] = await Promise.all([
          API.get("/movies/featured").catch(() => ({ data: { data: [] } })),
          API.get("/movies?status=NOW_SHOWING&limit=4").catch(() => ({ data: { data: [] } })),
        ]);
        setFeaturedMovies(featuredRes.data.data || []);
        setNowShowing(nowShowingRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch home movie data", err);
      } finally {
        setMoviesLoading(false);
      }
    };

    loadHomeData();
  }, []);

  // System diagnostic check
  const checkApiHealth = async () => {
    setDiagLoading(true);
    try {
      const [healthRes, pingRes, seedRes] = await Promise.all([
        API.get("/health"),
        API.get("/health/ping"),
        API.get("/seed/status").catch(() => ({ data: null })),
      ]);
      setHealthData(healthRes.data);
      setPingData(pingRes.data);
      setSeedData(seedRes.data);
    } catch (err) {
      console.error("Diagnostic error", err);
    } finally {
      setDiagLoading(false);
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  return (
    <div>
      {/* Featured Movie Banner Showcase */}
      {featuredMovies.length > 0 && <HeroBanner movies={featuredMovies} />}

      {/* Now Showing Section */}
      <section style={{ marginBottom: "3.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <div className="badge badge-primary" style={{ marginBottom: "0.35rem" }}>
              In Theatres Now
            </div>
            <h2 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Now Showing Movies
            </h2>
          </div>
          <Link
            to="/movies"
            className="btn btn-secondary"
            style={{ fontSize: "0.85rem", padding: "0.5rem 0.9rem" }}
          >
            <span>Explore All Movies</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {moviesLoading ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
            <RefreshCw size={28} style={{ animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
            <p>Loading latest cinema titles...</p>
          </div>
        ) : nowShowing.length === 0 ? (
          <div className="glass-card" style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
            <Film size={36} color="var(--text-muted)" style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ color: "var(--text-secondary)" }}>No movies currently showing. Run the seeder to populate movies.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.5rem" }}>
            {nowShowing.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      {/* Diagnostics & Architecture Dashboard */}
      <div className="glass-card" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Server size={22} color="var(--primary)" />
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>System & API Health Dashboard</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Real-time MERN stack diagnostics and Vercel serverless monitoring
              </p>
            </div>
          </div>
          <button
            onClick={checkApiHealth}
            disabled={diagLoading}
            className="btn btn-secondary"
            style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
          >
            <RefreshCw size={14} style={{ animation: diagLoading ? "spin 1s linear infinite" : "none" }} />
            <span>{diagLoading ? "Checking..." : "Re-test"}</span>
          </button>
        </div>

        {healthData && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Backend API</span>
              </div>
              <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--success)" }}>
                Operational ({pingData?.message})
              </p>
            </div>

            <div style={{ padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                <Database size={16} color="var(--accent)" />
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>MongoDB Atlas</span>
              </div>
              <p style={{ fontSize: "0.95rem", fontWeight: 700, color: healthData.database.connected ? "var(--success)" : "var(--accent)" }}>
                {healthData.database.status} ({seedData?.counts?.movies || 0} Movies, {seedData?.counts?.shows || 0} Shows)
              </p>
            </div>

            <div style={{ padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                <Globe size={16} color="#60a5fa" />
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Deployment State</span>
              </div>
              <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#60a5fa" }}>
                Vercel Functions Ready
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Home;
