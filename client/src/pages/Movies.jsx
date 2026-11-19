import React, { useState, useEffect } from "react";
import { Search, Filter, SlidersHorizontal, RefreshCw, Film, X } from "lucide-react";
import API from "../services/api";
import MovieCard from "../components/movie/MovieCard";

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [languages, setLanguages] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("NOW_SHOWING");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [sort, setSort] = useState("rating:desc");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 12,
        sort,
      };

      if (status !== "ALL") params.status = status;
      if (selectedGenre !== "All") params.genre = selectedGenre;
      if (selectedLanguage !== "All") params.language = selectedLanguage;
      if (search.trim()) params.search = search.trim();

      const response = await API.get("/movies", { params });
      setMovies(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalCount(response.data.total || 0);

      if (response.data.filters) {
        setGenres(["All", ...(response.data.filters.genres || [])]);
        setLanguages(["All", ...(response.data.filters.languages || [])]);
      }
    } catch (err) {
      setError(err.message || "Failed to load movies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [status, selectedGenre, selectedLanguage, sort, page]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchMovies();
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const clearFilters = () => {
    setSearch("");
    setStatus("NOW_SHOWING");
    setSelectedGenre("All");
    setSelectedLanguage("All");
    setSort("rating:desc");
    setPage(1);
  };

  return (
    <div>
      {/* Page Header & Status Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Explore <span style={{ color: "var(--primary)" }}>Movies</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Discover blockbuster movies, upcoming releases, and showtimes
          </p>
        </div>

        {/* Status Switcher Tabs */}
        <div
          style={{
            display: "inline-flex",
            backgroundColor: "var(--bg-secondary)",
            padding: "0.3rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
          }}
        >
          <button
            onClick={() => { setStatus("NOW_SHOWING"); setPage(1); }}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              fontWeight: 600,
              backgroundColor: status === "NOW_SHOWING" ? "var(--primary)" : "transparent",
              color: status === "NOW_SHOWING" ? "#fff" : "var(--text-secondary)",
            }}
          >
            Now Showing
          </button>
          <button
            onClick={() => { setStatus("UPCOMING"); setPage(1); }}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              fontWeight: 600,
              backgroundColor: status === "UPCOMING" ? "var(--primary)" : "transparent",
              color: status === "UPCOMING" ? "#fff" : "var(--text-secondary)",
            }}
          >
            Coming Soon
          </button>
          <button
            onClick={() => { setStatus("ALL"); setPage(1); }}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              fontWeight: 600,
              backgroundColor: status === "ALL" ? "var(--primary)" : "transparent",
              color: status === "ALL" ? "#fff" : "var(--text-secondary)",
            }}
          >
            All Movies
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="glass-card" style={{ padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", alignItems: "center" }}>
          {/* Search Input */}
          <div style={{ position: "relative" }}>
            <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "12px" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or keyword..."
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem 0.65rem 2.4rem",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                color: "#fff",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ position: "absolute", right: "10px", top: "12px", background: "none", color: "var(--text-muted)" }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Genre Filter */}
          <div>
            <select
              value={selectedGenre}
              onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                color: "#fff",
                fontSize: "0.9rem",
                outline: "none",
              }}
            >
              <option value="All">All Genres</option>
              {genres.filter((g) => g !== "All").map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <select
              value={selectedLanguage}
              onChange={(e) => { setSelectedLanguage(e.target.value); setPage(1); }}
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                color: "#fff",
                fontSize: "0.9rem",
                outline: "none",
              }}
            >
              <option value="All">All Languages</option>
              {languages.filter((l) => l !== "All").map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                color: "#fff",
                fontSize: "0.9rem",
                outline: "none",
              }}
            >
              <option value="rating:desc">Highest Rated</option>
              <option value="releaseDate:desc">Newest Releases</option>
              <option value="releaseDate:asc">Oldest Releases</option>
              <option value="title:asc">Title (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(search || selectedGenre !== "All" || selectedLanguage !== "All" || status !== "NOW_SHOWING") && (
          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            <span>Showing filtered results ({totalCount} movies found)</span>
            <button
              onClick={clearFilters}
              style={{ background: "none", color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}
            >
              <X size={14} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Movies Grid / Loading / Empty State */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-secondary)" }}>
          <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p>Loading movies from IMovies catalog...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <p style={{ color: "var(--danger)", marginBottom: "1rem" }}>{error}</p>
          <button onClick={fetchMovies} className="btn btn-secondary">
            Retry
          </button>
        </div>
      ) : movies.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }} className="glass-card">
          <Film size={48} color="var(--text-muted)" style={{ margin: "0 auto 1rem" }} />
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            No Movies Found
          </h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            We couldn't find any movies matching your current filters or search terms.
          </p>
          <button onClick={clearFilters} className="btn btn-primary">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "1.75rem",
              marginBottom: "2.5rem",
            }}
          >
            {movies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "2rem" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
                style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`btn ${p === page ? "btn-primary" : "btn-secondary"}`}
                  style={{ width: "36px", height: "36px", padding: 0, fontSize: "0.85rem" }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary"
                style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Movies;

