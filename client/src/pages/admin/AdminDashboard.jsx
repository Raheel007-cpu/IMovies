import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  TrendingUp,
  Ticket,
  Film,
  Building,
  Users,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Play,
  Video,
  X,
  Search,
  Star,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import API from "../../services/api";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview"); // overview, movies, theatres, shows, bookings
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [notification, setNotification] = useState({ type: "", text: "" });

  // Additional data for dropdowns
  const [moviesList, setMoviesList] = useState([]);
  const [theatresList, setTheatresList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [allBookings, setAllBookings] = useState([]);

  // Form states
  const initialMovieState = {
    title: "",
    description: "",
    genre: "Action, Sci-Fi",
    language: "English, Hindi",
    duration: 150,
    releaseDate: new Date().toISOString().split("T")[0],
    posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
    bannerUrl: "",
    trailerUrl: "",
    certificate: "UA",
    status: "NOW_SHOWING",
    imdbId: "",
    imdbRating: 0,
    imdbVotes: "",
  };

  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [newMovie, setNewMovie] = useState(initialMovieState);

  // Real-Time IMDB search state
  const [imdbSearchQuery, setImdbSearchQuery] = useState("");
  const [isFetchingImdb, setIsFetchingImdb] = useState(false);
  const [syncingMovieId, setSyncingMovieId] = useState(null);

  const [showAddTheatreModal, setShowAddTheatreModal] = useState(false);
  const [newTheatre, setNewTheatre] = useState({
    name: "",
    city: "",
    address: "",
    amenities: "Dolby Atmos, 4K Laser, Recliners, Parking",
  });

  const [newShow, setNewShow] = useState({
    movie: "",
    theatre: "",
    screen: "",
    startTime: "",
    endTime: "",
    silverPrice: 200,
    goldPrice: 280,
    platinumPrice: 400,
  });

  const [theatreScreens, setTheatreScreens] = useState([]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, moviesRes, theatresRes, citiesRes] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/movies?limit=50"),
        API.get("/theatres"),
        API.get("/cities"),
      ]);

      setStatsData(statsRes.data.data);
      setMoviesList(moviesRes.data.data || []);
      setTheatresList(theatresRes.data.data || []);
      setCitiesList(citiesRes.data.data || []);

      if (theatresRes.data.data?.length > 0 && !newTheatre.city && citiesRes.data.data?.length > 0) {
        setNewTheatre((prev) => ({ ...prev, city: citiesRes.data.data[0]._id }));
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch all bookings when Bookings tab is active
  useEffect(() => {
    if (activeTab === "bookings") {
      API.get("/admin/bookings")
        .then((res) => setAllBookings(res.data.data || []))
        .catch((err) => console.error("Error fetching bookings", err));
    }
  }, [activeTab]);

  // Load screens when theatre changes in Show Scheduling
  const handleTheatreChangeForShow = async (theatreId) => {
    setNewShow((prev) => ({ ...prev, theatre: theatreId, screen: "" }));
    if (!theatreId) {
      setTheatreScreens([]);
      return;
    }
    try {
      const res = await API.get(`/theatres/${theatreId}`);
      setTheatreScreens(res.data.data.screens || []);
      if (res.data.data.screens?.length > 0) {
        setNewShow((prev) => ({ ...prev, screen: res.data.data.screens[0]._id }));
      }
    } catch (err) {
      console.error("Error loading screens", err);
    }
  };

  // Real-Time IMDB Auto-Fetch Handler
  const handleImdbLookup = async () => {
    if (!imdbSearchQuery.trim()) return;
    setIsFetchingImdb(true);
    try {
      const isId = imdbSearchQuery.trim().toLowerCase().startsWith("tt");
      const param = isId
        ? `imdbId=${encodeURIComponent(imdbSearchQuery.trim())}`
        : `title=${encodeURIComponent(imdbSearchQuery.trim())}`;
      const res = await API.get(`/movies/imdb/lookup?${param}`);
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setNewMovie((prev) => ({
          ...prev,
          title: d.title || prev.title,
          description: d.plot || prev.description,
          genre: Array.isArray(d.genre) ? d.genre.join(", ") : d.genre || prev.genre,
          language: Array.isArray(d.language) ? d.language.join(", ") : d.language || prev.language,
          duration: d.duration || prev.duration,
          releaseDate: d.released
            ? new Date(d.released).toISOString().split("T")[0]
            : prev.releaseDate,
          posterUrl: d.posterUrl || prev.posterUrl,
          certificate: d.certificate || prev.certificate,
          imdbId: d.imdbId || "",
          imdbRating: d.imdbRating || 0,
          imdbVotes: d.imdbVotes || "",
        }));
        setNotification({
          type: "success",
          text: `⚡ Found "${d.title}" on IMDB: ⭐ ${d.imdbRating}/10 (${d.imdbVotes} votes)! Form auto-filled.`,
        });
      }
    } catch (err) {
      setNotification({
        type: "error",
        text: err.message || "Movie not found on IMDB. Try another title or IMDB ID.",
      });
    } finally {
      setIsFetchingImdb(false);
    }
  };

  // Sync Existing Movie With IMDB Real-Time
  const handleSyncMovieImdb = async (movieId, movieTitle) => {
    setSyncingMovieId(movieId);
    try {
      const res = await API.post(`/movies/${movieId}/sync-imdb`);
      if (res.data?.success) {
        setNotification({
          type: "success",
          text: `✓ Synced "${movieTitle}" with IMDB: ⭐ ${res.data.data.imdbRating}/10 (${res.data.data.imdbVotes || "N/A"})`,
        });
        setMoviesList((prev) =>
          prev.map((m) => (m._id === movieId ? res.data.data : m))
        );
      }
    } catch (err) {
      setNotification({
        type: "error",
        text: err.message || `Failed to sync "${movieTitle}" with IMDB`,
      });
    } finally {
      setSyncingMovieId(null);
    }
  };

  // Open Modal in Add or Edit mode
  const openAddMovieModal = () => {
    setEditingMovieId(null);
    setNewMovie(initialMovieState);
    setImdbSearchQuery("");
    setShowAddMovieModal(true);
  };

  const openEditMovieModal = (movie) => {
    setEditingMovieId(movie._id);
    setNewMovie({
      title: movie.title || "",
      description: movie.description || "",
      genre: Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre || "",
      language: Array.isArray(movie.language) ? movie.language.join(", ") : movie.language || "",
      duration: movie.duration || 150,
      releaseDate: movie.releaseDate
        ? new Date(movie.releaseDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      posterUrl: movie.posterUrl || "",
      bannerUrl: movie.bannerUrl || "",
      trailerUrl: movie.trailerUrl || "",
      certificate: movie.certificate || "UA",
      status: movie.status || "NOW_SHOWING",
      imdbId: movie.imdbId || "",
      imdbRating: movie.imdbRating ?? movie.rating ?? 0,
      imdbVotes: movie.imdbVotes || "",
    });
    setImdbSearchQuery(movie.imdbId || movie.title || "");
    setShowAddMovieModal(true);
  };

  // Create or Update Movie Handler
  const handleSaveMovie = async (e) => {
    e.preventDefault();
    try {
      if (editingMovieId) {
        await API.put(`/movies/${editingMovieId}`, newMovie);
        setNotification({ type: "success", text: "Movie updated successfully!" });
      } else {
        await API.post("/movies", newMovie);
        setNotification({ type: "success", text: "Movie added to catalog successfully!" });
      }
      setShowAddMovieModal(false);
      setEditingMovieId(null);
      fetchStats();
    } catch (err) {
      setNotification({
        type: "error",
        text: err.message || (editingMovieId ? "Failed to update movie" : "Failed to create movie"),
      });
    }
  };

  // Delete Movie Handler
  const handleDeleteMovie = async (movieId, movieTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${movieTitle}"?`)) return;
    try {
      await API.delete(`/movies/${movieId}`);
      setNotification({ type: "success", text: `Deleted "${movieTitle}"` });
      fetchStats();
    } catch (err) {
      setNotification({ type: "error", text: err.message || "Failed to delete movie" });
    }
  };

  // Add Theatre Handler
  const handleAddTheatre = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/theatres", newTheatre);
      // Automatically add default Screen 1 with 30 physical seats
      await API.post(`/admin/theatres/${res.data.data._id}/screens`, {
        screenNumber: "1",
        name: "Audi 1 - 4K Laser",
      });

      setNotification({ type: "success", text: "Theatre and master Screen 1 created successfully!" });
      setShowAddTheatreModal(false);
      fetchStats();
    } catch (err) {
      setNotification({ type: "error", text: err.message || "Failed to add theatre" });
    }
  };

  // Schedule Show Handler
  const handleScheduleShow = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        movie: newShow.movie,
        theatre: newShow.theatre,
        screen: newShow.screen,
        startTime: newShow.startTime,
        endTime: newShow.endTime,
        pricing: [
          { category: "Silver", price: Number(newShow.silverPrice) },
          { category: "Gold", price: Number(newShow.goldPrice) },
          { category: "Platinum", price: Number(newShow.platinumPrice) },
        ],
      };

      await API.post("/shows", payload);
      setNotification({ type: "success", text: "Show scheduled and ShowSeats populated successfully!" });
      fetchStats();
    } catch (err) {
      setNotification({ type: "error", text: err.message || "Failed to schedule show" });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 1rem", color: "var(--text-secondary)" }}>
        <RefreshCw size={36} style={{ animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
        <p>Loading Admin Management Console...</p>
      </div>
    );
  }

  const { metrics, recentBookings } = statsData || { metrics: {}, recentBookings: [] };

  return (
    <div>
      {/* Console Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span className="badge badge-primary">Super Administrator</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Control Center</span>
          </div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800 }}>Admin Dashboard</h1>
        </div>

        <button onClick={fetchStats} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
          <RefreshCw size={15} />
          <span>Refresh Data</span>
        </button>
      </div>

      {notification.text && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            backgroundColor: notification.type === "success" ? "var(--success-bg)" : "rgba(239, 68, 68, 0.12)",
            border: `1px solid ${notification.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            borderRadius: "var(--radius-md)",
            marginBottom: "1.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.9rem",
            color: notification.type === "success" ? "var(--success)" : "#fecaca",
          }}
        >
          {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--accent)", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>Total Revenue</span>
            <DollarSign size={20} />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800 }}>₹{metrics.revenue?.toLocaleString() || 0}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {metrics.confirmedBookings} confirmed bookings
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--primary)", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>Tickets Sold</span>
            <Ticket size={20} />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800 }}>{metrics.ticketsSold || 0}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Across all screenings
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#38bdf8", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>Movies</span>
            <Film size={20} />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800 }}>{metrics.totalMovies || 0}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {metrics.nowShowingMovies} Now Showing
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#a855f7", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>Theatres & Shows</span>
            <Building size={20} />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800 }}>{metrics.totalTheatres || 0}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {metrics.totalShows} active showtimes
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "2rem", overflowX: "auto" }}>
        {[
          { id: "overview", label: "Overview & Transactions" },
          { id: "movies", label: "Movies CRUD" },
          { id: "theatres", label: "Theatres & Screens" },
          { id: "shows", label: "Schedule Show" },
          { id: "bookings", label: "All Bookings" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: activeTab === tab.id ? "var(--primary)" : "transparent",
              color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "0.9rem",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & RECENT BOOKINGS */}
      {activeTab === "overview" && (
        <div className="glass-card">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.25rem" }}>
            Recent Platform Transactions
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Customer</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Movie</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Cinema</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Seats</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Amount</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b._id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <div style={{ fontWeight: 700 }}>{b.user?.name || "Customer"}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{b.user?.email}</div>
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>{b.show?.movie?.title}</td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>{b.show?.theatre?.name}</td>
                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "var(--primary)" }}>
                      {b.seats.map((s) => s.seatNumber).join(", ")}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>₹{b.finalAmount}</td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <span className={`badge ${b.bookingStatus === "CONFIRMED" ? "badge-success" : "badge-primary"}`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MOVIES CRUD */}
      {activeTab === "movies" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Manage Movies Catalog</h2>
            <button onClick={openAddMovieModal} className="btn btn-primary" style={{ fontSize: "0.85rem" }}>
              <Plus size={16} />
              <span>Add New Movie</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {moviesList.map((m) => (
              <div key={m._id} className="glass-card" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <img src={m.posterUrl} alt={m.title} style={{ width: "60px", height: "85px", objectFit: "cover", borderRadius: "6px" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.2rem" }}>
                    <span className="badge badge-primary" style={{ fontSize: "0.65rem" }}>{m.status}</span>
                  </div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.title}
                  </h4>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{m.duration} mins • {m.genre?.slice(0, 2).join(", ")}</p>

                  {/* Real-time IMDB rating badge in Admin Table */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        padding: "0.15rem 0.45rem",
                        backgroundColor: "#F5C518",
                        borderRadius: "4px",
                        color: "#000",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                      }}
                      title="IMDB Rating"
                    >
                      <span>IMDB</span>
                      <Star size={11} fill="#000" color="#000" />
                      <span>{(m.imdbRating || m.rating || 0).toFixed(1)}</span>
                    </span>
                    {m.imdbVotes && (
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        ({m.imdbVotes})
                      </span>
                    )}
                  </div>

                  {m.trailerUrl && (
                    <a
                      href={m.trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        fontSize: "0.75rem",
                        color: "var(--accent)",
                        fontWeight: 600,
                        marginTop: "0.3rem",
                      }}
                    >
                      <Play size={11} fill="var(--accent)" />
                      <span>Watch Trailer</span>
                    </a>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <button
                    onClick={() => openEditMovieModal(m)}
                    style={{ background: "none", color: "#60a5fa", padding: "0.4rem", cursor: "pointer", border: "none" }}
                    title="Edit Movie"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleSyncMovieImdb(m._id, m.title)}
                    disabled={syncingMovieId === m._id}
                    style={{ background: "none", color: "var(--accent)", padding: "0.4rem", cursor: "pointer", border: "none" }}
                    title="Sync Live Rating from IMDB"
                  >
                    <RefreshCw size={16} className={syncingMovieId === m._id ? "spin" : ""} />
                  </button>
                  <button
                    onClick={() => handleDeleteMovie(m._id, m.title)}
                    style={{ background: "none", color: "var(--danger)", padding: "0.4rem", cursor: "pointer", border: "none" }}
                    title="Delete Movie"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Movie Modal */}
          {showAddMovieModal && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
              <div className="glass-card" style={{ maxWidth: "580px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                    {editingMovieId ? "Edit Movie" : "Add New Movie"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddMovieModal(false);
                      setEditingMovieId(null);
                    }}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Real-Time IMDB Auto-Fill Search Toolbar */}
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>
                      <Sparkles size={15} color="var(--text-muted)" />
                      <span>Real-Time IMDB Auto-Fetch</span>
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Title or IMDB ID (e.g. tt15398776)</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="e.g. Oppenheimer, Interstellar, or tt15398776..."
                      value={imdbSearchQuery}
                      onChange={(e) => setImdbSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleImdbLookup();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: "0.55rem 0.8rem",
                        backgroundColor: "var(--bg-primary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "6px",
                        color: "#fff",
                        fontSize: "0.85rem",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleImdbLookup}
                      disabled={isFetchingImdb || !imdbSearchQuery.trim()}
                      className="btn btn-secondary"
                      style={{
                        padding: "0.55rem 1rem",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        backgroundColor: "#F5C518",
                        color: "#000",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {isFetchingImdb ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
                      <span>{isFetchingImdb ? "Fetching..." : "Fetch IMDB"}</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveMovie}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Title</label>
                    <input type="text" value={newMovie.title} onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })} required style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Description</label>
                    <textarea rows="3" value={newMovie.description} onChange={(e) => setNewMovie({ ...newMovie, description: e.target.value })} required style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Genre (comma separated)</label>
                      <input type="text" value={newMovie.genre} onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })} required style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Language (comma separated)</label>
                      <input type="text" value={newMovie.language} onChange={(e) => setNewMovie({ ...newMovie, language: e.target.value })} required style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Duration (mins)</label>
                      <input type="number" value={newMovie.duration} onChange={(e) => setNewMovie({ ...newMovie, duration: e.target.value })} required style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Release Date</label>
                      <input type="date" value={newMovie.releaseDate} onChange={(e) => setNewMovie({ ...newMovie, releaseDate: e.target.value })} required style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Poster Image URL *</label>
                    <input type="url" value={newMovie.posterUrl} onChange={(e) => setNewMovie({ ...newMovie, posterUrl: e.target.value })} required style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--accent)", marginBottom: "0.3rem", fontWeight: 600 }}>
                      🎬 Trailer Video URL (YouTube e.g. https://www.youtube.com/watch?v=...)
                    </label>
                    <input
                      type="url"
                      value={newMovie.trailerUrl}
                      onChange={(e) => setNewMovie({ ...newMovie, trailerUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }}
                    />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Backdrop / Banner URL (Optional)</label>
                    <input
                      type="url"
                      value={newMovie.bannerUrl}
                      onChange={(e) => setNewMovie({ ...newMovie, bannerUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "var(--accent)", marginBottom: "0.3rem", fontWeight: 600 }}>
                        ⭐ IMDB Rating (0 - 10)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={newMovie.imdbRating}
                        onChange={(e) => setNewMovie({ ...newMovie, imdbRating: e.target.value })}
                        placeholder="e.g. 8.8"
                        style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                        IMDB ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={newMovie.imdbId}
                        onChange={(e) => setNewMovie({ ...newMovie, imdbId: e.target.value })}
                        placeholder="e.g. tt1375666"
                        style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Certificate</label>
                      <select
                        value={newMovie.certificate}
                        onChange={(e) => setNewMovie({ ...newMovie, certificate: e.target.value })}
                        style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }}
                      >
                        <option value="U">U (Universal)</option>
                        <option value="UA">UA (Parental Guidance)</option>
                        <option value="A">A (Adult 18+)</option>
                        <option value="R">R (Restricted)</option>
                        <option value="PG-13">PG-13</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Release Status</label>
                      <select
                        value={newMovie.status}
                        onChange={(e) => setNewMovie({ ...newMovie, status: e.target.value })}
                        style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }}
                      >
                        <option value="NOW_SHOWING">Now Showing</option>
                        <option value="UPCOMING">Upcoming / Coming Soon</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddMovieModal(false);
                        setEditingMovieId(null);
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingMovieId ? "Save Changes" : "Create Movie"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: THEATRES MANAGEMENT */}
      {activeTab === "theatres" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Theatres & Screen Inventory</h2>
            <button onClick={() => setShowAddTheatreModal(true)} className="btn btn-primary" style={{ fontSize: "0.85rem" }}>
              <Plus size={16} />
              <span>Add Theatre</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {theatresList.map((t) => (
              <div key={t._id} className="glass-card">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <Building size={18} color="var(--primary)" />
                  <h4 style={{ fontSize: "1.1rem", fontWeight: 800 }}>{t.name}</h4>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{t.address}</p>
                <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  City: <strong style={{ color: "#fff" }}>{t.city?.name || "City"}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Add Theatre Modal */}
          {showAddTheatreModal && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
              <div className="glass-card" style={{ maxWidth: "500px", width: "100%", padding: "2rem" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "1.25rem" }}>Add New Theatre</h3>
                <form onSubmit={handleAddTheatre}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Cinema Name</label>
                    <input type="text" value={newTheatre.name} onChange={(e) => setNewTheatre({ ...newTheatre, name: e.target.value })} placeholder="PVR Cinemas..." required style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>City</label>
                    <select value={newTheatre.city} onChange={(e) => setNewTheatre({ ...newTheatre, city: e.target.value })} required style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }}>
                      {citiesList.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Address</label>
                    <input type="text" value={newTheatre.address} onChange={(e) => setNewTheatre({ ...newTheatre, address: e.target.value })} placeholder="Mall, Road, Area..." required style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Amenities (comma separated)</label>
                    <input type="text" value={newTheatre.amenities} onChange={(e) => setNewTheatre({ ...newTheatre, amenities: e.target.value })} style={{ width: "100%", padding: "0.6rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <button type="button" onClick={() => setShowAddTheatreModal(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">Create Theatre & Screen 1</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SCHEDULE SHOW */}
      {activeTab === "shows" && (
        <div className="glass-card" style={{ maxWidth: "650px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>Schedule a New Show</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Screen availability is automatically validated to prevent overlapping schedules.
          </p>

          <form onSubmit={handleScheduleShow}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Select Movie</label>
              <select value={newShow.movie} onChange={(e) => setNewShow({ ...newShow, movie: e.target.value })} required style={{ width: "100%", padding: "0.65rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }}>
                <option value="">-- Choose Movie --</option>
                {moviesList.map((m) => (
                  <option key={m._id} value={m._id}>{m.title} ({m.certificate})</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Select Theatre</label>
                <select value={newShow.theatre} onChange={(e) => handleTheatreChangeForShow(e.target.value)} required style={{ width: "100%", padding: "0.65rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }}>
                  <option value="">-- Choose Theatre --</option>
                  {theatresList.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Select Screen</label>
                <select value={newShow.screen} onChange={(e) => setNewShow({ ...newShow, screen: e.target.value })} required disabled={theatreScreens.length === 0} style={{ width: "100%", padding: "0.65rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }}>
                  <option value="">{theatreScreens.length === 0 ? "Select Theatre First" : "-- Choose Screen --"}</option>
                  {theatreScreens.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.soundSystem})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Start Date & Time</label>
                <input type="datetime-local" value={newShow.startTime} onChange={(e) => setNewShow({ ...newShow, startTime: e.target.value })} required style={{ width: "100%", padding: "0.65rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>End Date & Time</label>
                <input type="datetime-local" value={newShow.endTime} onChange={(e) => setNewShow({ ...newShow, endTime: e.target.value })} required style={{ width: "100%", padding: "0.65rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
              </div>
            </div>

            {/* Pricing Structure */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Tier Pricing (₹)</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Silver Tier</span>
                  <input type="number" value={newShow.silverPrice} onChange={(e) => setNewShow({ ...newShow, silverPrice: e.target.value })} required style={{ width: "100%", padding: "0.55rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Gold Tier</span>
                  <input type="number" value={newShow.goldPrice} onChange={(e) => setNewShow({ ...newShow, goldPrice: e.target.value })} required style={{ width: "100%", padding: "0.55rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Platinum Tier</span>
                  <input type="number" value={newShow.platinumPrice} onChange={(e) => setNewShow({ ...newShow, platinumPrice: e.target.value })} required style={{ width: "100%", padding: "0.55rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.8rem" }}>
              <Calendar size={18} />
              <span>Schedule Show & Generate Seats</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: ALL BOOKINGS AUDIT */}
      {activeTab === "bookings" && (
        <div className="glass-card">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.25rem" }}>
            Platform Bookings Ledger ({allBookings.length} records)
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Booking Ref</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>User</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Movie</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Seats</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Method</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Total</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.map((b) => (
                  <tr key={b._id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "0.75rem 0.5rem", fontFamily: "monospace", fontWeight: 700 }}>
                      {b.bookingNumber}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <div>{b.user?.name || "Customer"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{b.user?.email}</div>
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>{b.show?.movie?.title}</td>
                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "var(--primary)" }}>
                      {b.seats.map((s) => s.seatNumber).join(", ")}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem" }}>{b.paymentMethod}</td>
                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>₹{b.finalAmount}</td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <span className={`badge ${b.bookingStatus === "CONFIRMED" ? "badge-success" : "badge-primary"}`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

