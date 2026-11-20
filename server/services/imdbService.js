/**
 * IMDB Integration Service via OMDb API
 * Fetches real-time ratings, votes, awards, and movie metadata
 */

const getApiKey = () => {
  return process.env.OMDB_API_KEY || "trilogy";
};

// Maps US/International MPAA ratings to IMovies certificate enum: ["U", "UA", "A", "R", "PG-13"]
const mapCertificate = (rated) => {
  if (!rated || rated === "N/A") return "UA";
  const upper = rated.toUpperCase().trim();
  if (upper === "G" || upper === "U") return "U";
  if (upper === "PG" || upper === "PG-13" || upper === "TV-14") return "UA";
  if (upper === "R" || upper === "NC-17" || upper === "A" || upper === "18+") return "A";
  if (upper === "PG-13") return "PG-13";
  return "UA";
};

/**
 * Fetch real-time IMDB data by movie title or IMDB ID (ttXXXXXXX)
 * @param {Object} options - { title, imdbId, year }
 * @returns {Promise<Object>} Normalized IMDB movie details and ratings
 */
const fetchImdbData = async ({ title, imdbId, year } = {}) => {
  const apiKey = getApiKey();

  if (!title && !imdbId) {
    throw new Error("Either movie title or IMDB ID is required for IMDB lookup");
  }

  // Construct query parameters
  const params = new URLSearchParams({
    apikey: apiKey,
    plot: "full",
  });

  if (imdbId) {
    params.set("i", imdbId.trim());
  } else if (title) {
    params.set("t", title.trim());
    if (year) params.set("y", year.toString().trim());
  }

  const url = `https://www.omdbapi.com/?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`IMDB API request failed with status: ${response.status}`);
    }

    const data = await response.json();

    if (data.Response === "False") {
      return {
        success: false,
        message: data.Error || "Movie not found on IMDB",
      };
    }

    // Parse runtime in minutes
    let durationMinutes = 120;
    if (data.Runtime && data.Runtime !== "N/A") {
      const parsed = parseInt(data.Runtime.replace(/\D/g, ""), 10);
      if (!isNaN(parsed) && parsed > 0) durationMinutes = parsed;
    }

    // Parse numeric rating
    const numericRating =
      data.imdbRating && data.imdbRating !== "N/A"
        ? parseFloat(data.imdbRating)
        : 0;

    // Parse votes count
    let numericVotes = 0;
    if (data.imdbVotes && data.imdbVotes !== "N/A") {
      numericVotes = parseInt(data.imdbVotes.replace(/,/g, ""), 10) || 0;
    }

    // Parse genres
    const genres =
      data.Genre && data.Genre !== "N/A"
        ? data.Genre.split(",").map((g) => g.trim())
        : ["Drama"];

    // Parse languages
    const languages =
      data.Language && data.Language !== "N/A"
        ? data.Language.split(",").map((l) => l.trim())
        : ["English"];

    return {
      success: true,
      title: data.Title,
      year: data.Year,
      released: data.Released !== "N/A" ? new Date(data.Released) : new Date(),
      certificate: mapCertificate(data.Rated),
      duration: durationMinutes,
      genre: genres,
      director: data.Director !== "N/A" ? data.Director : "",
      actors: data.Actors !== "N/A" ? data.Actors : "",
      plot: data.Plot !== "N/A" ? data.Plot : "",
      language: languages,
      posterUrl: data.Poster && data.Poster !== "N/A" ? data.Poster : null,
      imdbId: data.imdbID,
      imdbRating: numericRating,
      imdbVotes: data.imdbVotes !== "N/A" ? data.imdbVotes : "0",
      votesCount: numericVotes,
      boxOffice: data.BoxOffice !== "N/A" ? data.BoxOffice : null,
      awards: data.Awards !== "N/A" ? data.Awards : null,
      source: "IMDB / OMDb API",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("IMDB API fetch error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to reach IMDB API",
    };
  }
};

module.exports = {
  fetchImdbData,
};
