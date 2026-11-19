import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Film,
  ArrowRight,
  RefreshCw,
  Zap,
  QrCode,
  Star,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import API from "../services/api";
import HeroBanner from "../components/movie/HeroBanner";
import MovieCard from "../components/movie/MovieCard";

const Home = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [nowShowing, setNowShowing] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);

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

  const features = [
    {
      icon: Zap,
      color: "var(--primary)",
      bgColor: "var(--primary-light)",
      title: "Guaranteed Seat Hold",
      description:
        "Your selected seats are locked atomically for 10 minutes while you pay. Zero double-booking risk guaranteed.",
    },
    {
      icon: QrCode,
      color: "#f5c518",
      bgColor: "rgba(245, 197, 24, 0.12)",
      title: "Contactless QR Gate Pass",
      description:
        "No paper tickets or kiosk lines needed. Scan your dynamic digital QR ticket directly at the auditorium entrance.",
    },
    {
      icon: Star,
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.12)",
      title: "Live Verified IMDb Scores",
      description:
        "Powered by live IMDb sync. Check verified ratings, audience votes, runtimes, and official trailers before you book.",
    },
    {
      icon: ShieldCheck,
      color: "var(--success)",
      bgColor: "var(--success-bg)",
      title: "100% Secure Checkout",
      description:
        "Bank-grade encrypted payments via UPI, Credit/Debit cards, and NetBanking with instant booking verification.",
    },
  ];

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

      {/* Why Book With IMovies Section */}
      <section style={{ marginBottom: "3rem" }}>
        <div style={{ textAlign: "center", maxWidth: "650px", margin: "0 auto 2.5rem" }}>
          <div
            className="badge badge-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              marginBottom: "0.5rem",
              padding: "0.3rem 0.75rem",
            }}
          >
            <Sparkles size={13} />
            <span>Premium Cinema Experience</span>
          </div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
            Why Book With IMovies?
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Fast, transparent, and built for true moviegoers with real-time seat locks and digital QR ticketing.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="glass-card"
                style={{
                  padding: "1.75rem",
                  borderRadius: "var(--radius-lg)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: item.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.25rem",
                  }}
                >
                  <Icon size={24} color={item.color} />
                </div>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

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
