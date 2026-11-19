import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Play, Ticket, Clock, Film, X } from "lucide-react";

const HeroBanner = ({ movies = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTrailerUrl, setActiveTrailerUrl] = useState(null);

  useEffect(() => {
    if (movies.length <= 1 || activeTrailerUrl) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [movies.length, activeTrailerUrl]);

  if (!movies || movies.length === 0) return null;

  const currentMovie = movies[currentIndex] || movies[0];

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

  return (
    <>
      <div
        className="hero-banner"
        style={{
          position: "relative",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          minHeight: "420px",
          marginBottom: "2.5rem",
          backgroundColor: "#12161f",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border-color)",
        }}
      >
        {/* Background Backdrop Image */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url(${currentMovie.bannerUrl || currentMovie.posterUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center 25%",
            filter: "brightness(0.65) saturate(1.1)",
            transition: "background-image 0.6s ease-in-out",
          }}
        />

        {/* Gradient Vignette Overlays */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(90deg, rgba(10, 12, 16, 0.88) 0%, rgba(10, 12, 16, 0.45) 45%, rgba(10, 12, 16, 0.15) 100%)",
          }}
        />

        {/* Content Container */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "3.5rem 2.5rem",
            maxWidth: "750px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: "420px",
          }}
        >
          {/* Badges & Meta */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
            <span className="badge badge-primary">Featured Spotlight</span>
            <span
              className="imdb-badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.2rem 0.55rem",
                backgroundColor: "#F5C518",
                color: "#000",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: 800,
                boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
              }}
            >
              <span>IMDb</span>
              <Star size={12} fill="#000" color="#000" />
              <span>{(currentMovie.imdbRating || currentMovie.rating || 0).toFixed(1)}</span>
            </span>
            {currentMovie.imdbVotes && (
              <span style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.8rem", fontWeight: 500 }}>
                ({currentMovie.imdbVotes} votes)
              </span>
            )}
            <span style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Clock size={13} />
              <span>{currentMovie.duration} mins</span>
            </span>
            <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.85rem" }}>•</span>
            <span style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.85rem" }}>
              {currentMovie.certificate}
            </span>
          </div>

          {/* Title */}
          <h2
            className="hero-movie-title"
            style={{
              fontSize: "2.75rem",
              fontWeight: 800,
              marginBottom: "0.75rem",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#ffffff",
            }}
          >
            {currentMovie.title}
          </h2>

          {/* Genres & Languages */}
          <p style={{ color: "#f5c518", fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.85rem" }}>
            {currentMovie.genre?.join(" • ")} | <span style={{ color: "rgba(255, 255, 255, 0.85)" }}>{currentMovie.language?.join(", ")}</span>
          </p>

          {/* Description */}
          <p
            className="hero-movie-desc"
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              marginBottom: "1.75rem",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {currentMovie.description}
          </p>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link to={`/movies/${currentMovie._id}`} className="btn btn-primary" style={{ padding: "0.75rem 1.75rem", fontSize: "1rem" }}>
              <Ticket size={18} />
              <span>Book Tickets</span>
            </Link>

            {currentMovie.trailerUrl && (
              <button
                type="button"
                onClick={() => setActiveTrailerUrl(currentMovie.trailerUrl)}
                className="btn btn-secondary"
                style={{ padding: "0.75rem 1.4rem", fontSize: "0.95rem" }}
              >
                <Play size={16} fill="#fff" />
                <span>Watch Trailer</span>
              </button>
            )}
          </div>
        </div>

        {/* Slide Indicator Dots */}
        {movies.length > 1 && (
          <div style={{ position: "absolute", bottom: "18px", right: "24px", zIndex: 20, display: "flex", gap: "0.45rem", alignItems: "center" }}>
            {movies.map((m, idx) => (
              <button
                key={m._id}
                onClick={() => setCurrentIndex(idx)}
                title={`Go to slide ${idx + 1}`}
                style={{
                  width: idx === currentIndex ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: idx === currentIndex ? "var(--primary)" : "rgba(255, 255, 255, 0.4)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  border: "none",
                  outline: "none",
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Embedded Cinema Trailer Modal Player */}
      {activeTrailerUrl && (
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
          onClick={() => setActiveTrailerUrl(null)}
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
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{currentMovie.title} — Official Trailer</h3>
              </div>
              <button
                onClick={() => setActiveTrailerUrl(null)}
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

            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, backgroundColor: "#000" }}>
              <iframe
                src={getEmbedUrl(activeTrailerUrl)}
                title={`${currentMovie.title} Trailer`}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeroBanner;
