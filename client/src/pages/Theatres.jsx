import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useCity } from "../context/CityContext";
import API from "../services/api";
import {
  Building,
  MapPin,
  Calendar,
  Clock,
  Film,
  RefreshCw,
  Sparkles,
  Ticket,
} from "lucide-react";

const Theatres = () => {
  const [searchParams] = useSearchParams();
  const movieId = searchParams.get("movie");

  const { selectedCity } = useCity();

  const [theatres, setTheatres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [groupedShows, setGroupedShows] = useState([]);

  // Generate date tabs: Today + next 4 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push({
        fullDate: d.toISOString().split("T")[0],
        dayName: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" }),
        dateStr: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      });
    }
    return dates;
  };

  const [dateList] = useState(generateDates);
  const [selectedDate, setSelectedDate] = useState(dateList[0].fullDate);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // If a movie is specified in query param, fetch movie details
  useEffect(() => {
    if (!movieId) {
      setSelectedMovie(null);
      return;
    }
    const fetchMovie = async () => {
      try {
        const res = await API.get(`/movies/${movieId}`);
        setSelectedMovie(res.data.data);
      } catch (err) {
        console.error("Failed to fetch movie", err);
      }
    };
    fetchMovie();
  }, [movieId]);

  // Fetch theatres or shows based on city and date
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (movieId) {
          // Fetch scheduled shows for this movie in this city on this date
          const res = await API.get("/shows", {
            params: {
              movieId,
              city: selectedCity,
              date: selectedDate,
            },
          });
          setGroupedShows(res.data.groupedByTheatre || []);
        } else {
          // Fetch all theatres in the selected city
          const res = await API.get("/theatres", {
            params: { city: selectedCity },
          });
          setTheatres(res.data.data || []);
        }
      } catch (err) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCity, movieId, selectedDate]);

  // Format 24h ISO time to 12h AM/PM
  const formatShowtime = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>
          <MapPin size={16} />
          <span>Cinemas in {selectedCity}</span>
        </div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {movieId && selectedMovie ? (
            <>
              Showtimes for <span style={{ color: "var(--primary)" }}>{selectedMovie.title}</span>
            </>
          ) : (
            <>
              Explore <span style={{ color: "var(--primary)" }}>Theatres</span>
            </>
          )}
        </h1>
      </div>

      {/* Selected Movie Spotlight Pill (if filtering by movie) */}
      {selectedMovie && (
        <div
          className="glass-card"
          style={{
            padding: "1.25rem 1.5rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            background: "linear-gradient(90deg, rgba(229, 9, 20, 0.12) 0%, rgba(24, 29, 41, 0.8) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <img
              src={selectedMovie.posterUrl}
              alt={selectedMovie.title}
              style={{ width: "55px", height: "80px", objectFit: "cover", borderRadius: "6px" }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <span className="badge badge-primary">{selectedMovie.certificate}</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {selectedMovie.duration} mins • {selectedMovie.genre?.join(", ")}
                </span>
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>{selectedMovie.title}</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{selectedMovie.language?.join(", ")}</p>
            </div>
          </div>

          <Link to={`/movies/${selectedMovie._id}`} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
            <span>Movie Info</span>
          </Link>
        </div>
      )}

      {/* Date Picker Strip (When viewing movie showtimes) */}
      {movieId && (
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
            {dateList.map((d) => {
              const isSelected = d.fullDate === selectedDate;
              return (
                <button
                  key={d.fullDate}
                  onClick={() => setSelectedDate(d.fullDate)}
                  style={{
                    minWidth: "90px",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: isSelected ? "var(--primary)" : "var(--bg-secondary)",
                    border: `1px solid ${isSelected ? "var(--primary)" : "var(--border-color)"}`,
                    color: isSelected ? "#fff" : "var(--text-primary)",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected ? "0 4px 14px rgba(229, 9, 20, 0.35)" : "none",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", opacity: isSelected ? 1 : 0.7 }}>
                    {d.dayName}
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, marginTop: "0.2rem" }}>
                    {d.dateStr}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content Rendering */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-secondary)" }}>
          <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p>Loading cinemas and showtimes in {selectedCity}...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <p style={{ color: "var(--danger)", marginBottom: "1rem" }}>{error}</p>
        </div>
      ) : movieId ? (
        // SHOWTIMES VIEW: Grouped by Theatre
        groupedShows.length === 0 ? (
          <div className="glass-card" style={{ textAlign: "center", padding: "3.5rem 1rem" }}>
            <Calendar size={42} color="var(--text-muted)" style={{ margin: "0 auto 0.75rem" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              No Shows Scheduled
            </h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: "480px", margin: "0 auto 1.5rem" }}>
              There are no showtimes scheduled for this movie in <strong>{selectedCity}</strong> on the selected date.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button onClick={() => setSelectedDate(dateList[0].fullDate)} className="btn btn-secondary">
                View Today's Shows
              </button>
              <Link to="/movies" className="btn btn-primary">
                Browse Other Movies
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {groupedShows.map(({ theatre, shows }) => (
              <div key={theatre._id} className="glass-card" style={{ padding: "1.75rem" }}>
                {/* Theatre Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{theatre.name}</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      {theatre.address}
                    </p>
                  </div>

                  {/* Amenities */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {theatre.amenities?.map((amenity) => (
                      <span
                        key={amenity}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.2rem 0.5rem",
                          backgroundColor: "var(--bg-secondary)",
                          borderRadius: "4px",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Showtimes Pills */}
                <div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                    Available Showtimes
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                    {shows.map((show) => (
                      <Link
                        key={show._id}
                        to={`/shows/${show._id}/seats`}
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "0.6rem 1.15rem",
                          backgroundColor: "var(--bg-secondary)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-primary)",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                        className="showtime-pill"
                      >
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--success)" }}>
                          {formatShowtime(show.startTime)}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                          {show.screen?.name || "Audi 1"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // GENERAL THEATRES VIEW (When browsing all theatres in city)
        theatres.length === 0 ? (
          <div className="glass-card" style={{ textAlign: "center", padding: "3.5rem 1rem" }}>
            <Building size={42} color="var(--text-muted)" style={{ margin: "0 auto 0.75rem" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              No Theatres Listed in {selectedCity}
            </h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto" }}>
              Please select another city (like Mumbai or Bengaluru) using the City Selector in the header.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {theatres.map((theatre) => (
              <div key={theatre._id} className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "var(--primary-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Building size={20} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>{theatre.name}</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                      {theatre.address}
                    </p>
                  </div>
                </div>

                {/* Amenities */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1.25rem", marginTop: "auto" }}>
                  {theatre.amenities?.map((a) => (
                    <span
                      key={a}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.5rem",
                        backgroundColor: "var(--bg-secondary)",
                        borderRadius: "4px",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>

                <Link
                  to="/movies"
                  className="btn btn-secondary"
                  style={{ width: "100%", padding: "0.55rem", fontSize: "0.85rem" }}
                >
                  <Ticket size={15} />
                  <span>View Movies Playing Here</span>
                </Link>
              </div>
            ))}
          </div>
        )
      )}

      <style>{`
        .showtime-pill:hover {
          border-color: var(--primary);
          background-color: var(--bg-hover);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </div>
  );
};

export default Theatres;

