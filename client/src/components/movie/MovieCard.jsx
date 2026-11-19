import React from "react";
import { Link } from "react-router-dom";
import { Star, Ticket, Clock, Calendar } from "lucide-react";

const MovieCard = ({ movie }) => {
  const isUpcoming = movie.status === "UPCOMING";

  return (
    <div
      className="movie-card"
      style={{
        backgroundColor: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
        height: "100%",
      }}
    >
      {/* Poster Image Container */}
      <Link to={`/movies/${movie._id}`} style={{ position: "relative", overflow: "hidden", aspectRatio: "2/3", display: "block" }}>
        <img
          src={movie.posterUrl}
          alt={movie.title}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s ease",
          }}
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";
          }}
        />

        {/* Rating or Upcoming Badge */}
        <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "0.4rem" }}>
          {isUpcoming ? (
            <span className="badge badge-primary" style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(229, 9, 20, 0.85)" }}>
              Upcoming
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.2rem 0.5rem",
                backgroundColor: "#F5C518",
                borderRadius: "4px",
                color: "#000",
                fontSize: "0.78rem",
                fontWeight: 800,
                boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
              }}
            >
              <span style={{ fontSize: "0.72rem", letterSpacing: "-0.02em" }}>IMDb</span>
              <Star size={12} fill="#000" color="#000" />
              <span>{(movie.imdbRating || movie.rating || 0).toFixed(1)}</span>
            </span>
          )}
        </div>

        {/* Certificate Badge (UA, A, etc.) */}
        <div style={{ position: "absolute", bottom: "12px", left: "12px" }}>
          <span
            style={{
              padding: "0.2rem 0.5rem",
              backgroundColor: "rgba(10, 12, 16, 0.8)",
              backdropFilter: "blur(6px)",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            {movie.certificate || "UA"}
          </span>
        </div>
      </Link>

      {/* Movie Details Body */}
      <div style={{ padding: "1.1rem", display: "flex", flexDirection: "column", flex: 1 }}>
        <Link to={`/movies/${movie._id}`}>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              marginBottom: "0.4rem",
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={movie.title}
          >
            {movie.title}
          </h3>
        </Link>

        {/* Genres */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.6rem" }}>
          {movie.genre?.slice(0, 3).map((g) => (
            <span
              key={g}
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-secondary)",
                padding: "0.15rem 0.5rem",
                borderRadius: "4px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {g}
            </span>
          ))}
        </div>

        {/* Languages & Duration */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1rem", marginTop: "auto" }}>
          <span style={{ textTransform: "capitalize" }}>
            {movie.language?.slice(0, 2).join(", ")}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <Clock size={13} />
            <span>{movie.duration}m</span>
          </span>
        </div>

        {/* Action Button */}
        <Link
          to={`/movies/${movie._id}`}
          className={`btn ${isUpcoming ? "btn-secondary" : "btn-primary"}`}
          style={{ width: "100%", padding: "0.55rem", fontSize: "0.875rem" }}
        >
          {isUpcoming ? (
            <>
              <Calendar size={15} />
              <span>View Preview</span>
            </>
          ) : (
            <>
              <Ticket size={15} />
              <span>Book Tickets</span>
            </>
          )}
        </Link>
      </div>

      <style>{`
        .movie-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6);
          border-color: rgba(229, 9, 20, 0.4);
        }
        .movie-card:hover img {
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
};

export default MovieCard;

