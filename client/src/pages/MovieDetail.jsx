import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Star,
  Clock,
  Calendar,
  Share2,
  Play,
  Ticket,
  ArrowLeft,
  RefreshCw,
  Film,
  Building,
  X,
  ExternalLink,
} from "lucide-react";
import API from "../services/api";

const MovieDetail = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [liveImdb, setLiveImdb] = useState(null);
  const [syncingImdb, setSyncingImdb] = useState(false);
  const [syncNotice, setSyncNotice] = useState(null);

  const fetchLiveRating = async (sync = false) => {
    try {
      setSyncingImdb(true);
      const res = await API.get(`/movies/${id}/live-rating?sync=${sync}`);
      if (res.data?.success) {
        setLiveImdb(res.data);
        if (sync) {
          setSyncNotice("Live IMDb rating updated & synced!");
          setTimeout(() => setSyncNotice(null), 3500);
        }
      }
    } catch (err) {
      console.error("Live IMDb rating fetch error", err);
    } finally {
      setSyncingImdb(false);
    }
  };

  useEffect(() => {
    const fetchMovieDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await API.get(`/movies/${id}`);
        setMovie(response.data.data);
        // Automatically fetch live IMDb rating if not yet loaded
        fetchLiveRating(false);
      } catch (err) {
        setError(err.message || "Failed to load movie details");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  // Convert standard YouTube watch/share URL into embed format with autoplay
  const getEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
    }
    return url;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 1rem", color: "var(--text-secondary)" }}>
        <RefreshCw size={36} style={{ animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
        <p style={{ fontSize: "1.1rem" }}>Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }} className="glass-card">
        <Film size={44} color="var(--danger)" style={{ margin: "0 auto 1rem" }} />
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Movie Not Found</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          {error || "The movie you are looking for does not exist or has been removed."}
        </p>
        <Link to="/movies" className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Back to Movies</span>
        </Link>
      </div>
    );
  }

  const isUpcoming = movie.status === "UPCOMING";

  return (
    <div>
      {/* Back button */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          to="/movies"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Movies</span>
        </Link>
      </div>

      {/* Hero Showcase Card */}
      <div
        className="hero-banner"
        style={{
          position: "relative",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          backgroundColor: "#12161f",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-lg)",
          marginBottom: "2.5rem",
        }}
      >
        {/* Backdrop Blurred Background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url(${movie.bannerUrl || movie.posterUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
            filter: "blur(20px) brightness(0.2)",
            transform: "scale(1.1)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "2.5rem",
            display: "flex",
            gap: "2.5rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Movie Poster */}
          <div
            style={{
              width: "260px",
              flexShrink: 0,
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              margin: "0 auto",
            }}
          >
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{ width: "100%", height: "auto", display: "block" }}
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";
              }}
            />
          </div>

          {/* Details Overview */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <span className={`badge ${isUpcoming ? "badge-primary" : "badge-success"}`}>
                {isUpcoming ? "Upcoming" : "Now Showing"}
              </span>
              <span
                style={{
                  padding: "0.2rem 0.5rem",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {movie.certificate}
              </span>
            </div>

            <h1
              className="hero-movie-title"
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                marginBottom: "0.75rem",
                letterSpacing: "-0.02em",
                color: "#ffffff",
              }}
            >
              {movie.title}
            </h1>

            {/* Ratings & Meta Section */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              {/* Official IMDb Rating Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.35rem 0.75rem",
                  backgroundColor: "#F5C518",
                  borderRadius: "6px",
                  color: "#000",
                  fontWeight: 800,
                  fontSize: "1rem",
                  boxShadow: "0 2px 10px rgba(245, 197, 24, 0.35)",
                }}
              >
                <span style={{ letterSpacing: "-0.03em" }}>IMDb</span>
                <Star size={16} fill="#000" color="#000" />
                <span>
                  {(liveImdb?.imdbRating || movie.imdbRating || movie.rating || 0).toFixed(1)}
                  <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>/10</span>
                </span>
              </div>

              {/* Real-time IMDb Votes */}
              {(liveImdb?.imdbVotes || movie.imdbVotes || movie.votesCount > 0) && (
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                  ({liveImdb?.imdbVotes || movie.imdbVotes || `${movie.votesCount?.toLocaleString()} votes`})
                </span>
              )}

              {/* Live Real-Time Refresh Button */}
              <button
                type="button"
                onClick={() => fetchLiveRating(true)}
                disabled={syncingImdb}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  borderRadius: "6px",
                  padding: "0.35rem 0.7rem",
                  color: "var(--text-secondary)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                title="Fetch live real-time rating directly from IMDb"
              >
                <RefreshCw size={13} className={syncingImdb ? "spin" : ""} />
                <span>{syncingImdb ? "Updating..." : "Live IMDb Sync"}</span>
              </button>

              {/* Link to IMDb Title Page if ID exists */}
              {(liveImdb?.imdbId || movie.imdbId) && (
                <a
                  href={`https://www.imdb.com/title/${liveImdb?.imdbId || movie.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    color: "var(--accent)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                  title="View on IMDb"
                >
                  <span>IMDb Page</span>
                  <ExternalLink size={12} />
                </a>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "rgba(255, 255, 255, 0.85)", fontSize: "0.9rem" }}>
                <Clock size={16} />
                <span>{movie.duration} mins</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "rgba(255, 255, 255, 0.85)", fontSize: "0.9rem" }}>
                <Calendar size={16} />
                <span>{new Date(movie.releaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>

            {/* Live Sync Notice */}
            {syncNotice && (
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "0.4rem 0.8rem",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "6px",
                  color: "var(--success)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  display: "inline-block",
                }}
              >
                ✓ {syncNotice}
              </div>
            )}

            {/* Genres & Languages */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {movie.genre?.map((g) => (
                  <span
                    key={g}
                    style={{
                      padding: "0.3rem 0.75rem",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>

              <p style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.9rem" }}>
                Available in: <strong style={{ color: "#ffffff" }}>{movie.language?.join(", ")}</strong>
              </p>
            </div>

            {/* Synopsis */}
            <p
              className="hero-movie-desc"
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "1rem",
                lineHeight: 1.7,
                marginBottom: "2rem",
                maxWidth: "700px",
              }}
            >
              {movie.description}
            </p>

            {/* Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              {!isUpcoming ? (
                <Link
                  to={`/theatres?movie=${movie._id}`}
                  className="btn btn-primary"
                  style={{ padding: "0.8rem 1.8rem", fontSize: "1.05rem" }}
                >
                  <Ticket size={20} />
                  <span>Select Theatres & Showtimes</span>
                </Link>
              ) : (
                <button disabled className="btn btn-secondary" style={{ opacity: 0.8 }}>
                  <Calendar size={18} />
                  <span>Releasing Soon</span>
                </button>
              )}

              {movie.trailerUrl && (
                <button
                  type="button"
                  onClick={() => setIsTrailerOpen(true)}
                  className="btn btn-secondary"
                  style={{ padding: "0.8rem 1.4rem", fontSize: "0.95rem" }}
                >
                  <Play size={18} fill="#fff" />
                  <span>Watch Trailer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Cinema Trailer Modal Player */}
      {isTrailerOpen && movie.trailerUrl && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(8px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={() => setIsTrailerOpen(false)}
        >
          <div
            style={{
              maxWidth: "900px",
              width: "100%",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              backgroundColor: "#0d0f12",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9)",
              border: "1px solid var(--border-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 1.5rem",
                backgroundColor: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Film size={18} color="var(--primary)" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{movie.title} — Official Trailer</h3>
              </div>
              <button
                onClick={() => setIsTrailerOpen(false)}
                style={{
                  background: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "0.25rem",
                  borderRadius: "4px",
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* 16:9 Video Player */}
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, backgroundColor: "#000" }}>
              <iframe
                src={getEmbedUrl(movie.trailerUrl)}
                title={`${movie.title} Trailer`}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail;
