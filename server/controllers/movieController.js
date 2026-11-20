const { Movie } = require("../models");
const { fetchImdbData } = require("../services/imdbService");

/**
 * @desc    Get all movies with search, filters, sorting & pagination
 * @route   GET /api/movies
 * @access  Public
 */
const getMovies = async (req, res) => {
  try {
    const {
      search,
      genre,
      language,
      status,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // Filter by Status (NOW_SHOWING, UPCOMING, etc.)
    if (status) {
      query.status = status.toUpperCase();
    }

    // Filter by Genre (case-insensitive substring/item match)
    if (genre && genre !== "All") {
      query.genre = { $in: [new RegExp(`^${genre}$`, "i")] };
    }

    // Filter by Language
    if (language && language !== "All") {
      query.language = { $in: [new RegExp(`^${language}$`, "i")] };
    }

    // Search query on title and description
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Sorting configuration
    let sortOption = { releaseDate: -1 };
    if (sort === "rating:desc") {
      sortOption = { rating: -1, votesCount: -1 };
    } else if (sort === "releaseDate:desc") {
      sortOption = { releaseDate: -1 };
    } else if (sort === "releaseDate:asc") {
      sortOption = { releaseDate: 1 };
    } else if (sort === "title:asc") {
      sortOption = { title: 1 };
    }

    // Pagination calculations
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Execute queries in parallel with total count
    const [movies, total] = await Promise.all([
      Movie.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Movie.countDocuments(query),
    ]);

    // Extract distinct genres and languages across all movies for dynamic filter dropdowns
    const [allGenres, allLanguages] = await Promise.all([
      Movie.distinct("genre"),
      Movie.distinct("language"),
    ]);

    res.status(200).json({
      success: true,
      count: movies.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      filters: {
        genres: allGenres.sort(),
        languages: allLanguages.sort(),
      },
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch movies",
    });
  }
};

/**
 * @desc    Get featured movies for banner / spotlight
 * @route   GET /api/movies/featured
 * @access  Public
 */
const getFeaturedMovies = async (req, res) => {
  try {
    const featured = await Movie.find({ status: "NOW_SHOWING" })
      .sort({ rating: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      count: featured.length,
      data: featured,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch featured movies",
    });
  }
};

/**
 * @desc    Get single movie details by ID
 * @route   GET /api/movies/:id
 * @access  Public
 */
const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Movie not found with given identifier",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch movie",
    });
  }
};

/**
 * @desc    Create new movie (Admin only)
 * @route   POST /api/movies
 * @access  Admin Protected
 */
const createMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      genre,
      language,
      duration,
      releaseDate,
      posterUrl,
      bannerUrl,
      trailerUrl,
      rating,
      certificate,
      status,
      imdbId,
      imdbRating,
      imdbVotes,
    } = req.body;

    if (!title || !description || !genre || !language || !duration || !releaseDate || !posterUrl) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required movie fields",
      });
    }

    // Compute initial rating prioritizing imdbRating if provided
    const finalRating = imdbRating !== undefined && imdbRating !== null && imdbRating !== ""
      ? Number(imdbRating)
      : rating ? Number(rating) : 0;

    const movie = await Movie.create({
      title,
      description,
      genre: Array.isArray(genre) ? genre : genre.split(",").map((g) => g.trim()),
      language: Array.isArray(language) ? language : language.split(",").map((l) => l.trim()),
      duration: Number(duration),
      releaseDate,
      posterUrl,
      bannerUrl: bannerUrl || posterUrl,
      trailerUrl,
      rating: finalRating,
      certificate: certificate || "UA",
      status: status || "NOW_SHOWING",
      imdbId: imdbId ? imdbId.trim() : undefined,
      imdbRating: imdbRating ? Number(imdbRating) : finalRating,
      imdbVotes: imdbVotes || undefined,
      lastImdbSync: imdbRating ? new Date() : undefined,
    });

    res.status(201).json({
      success: true,
      message: "Movie created successfully",
      data: movie,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create movie",
    });
  }
};

/**
 * @desc    Update movie details (Admin only)
 * @route   PUT /api/movies/:id
 * @access  Admin Protected
 */
const updateMovie = async (req, res) => {
  try {
    let movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    // Process genre & language arrays if provided as string
    const updates = { ...req.body };
    if (typeof updates.genre === "string") {
      updates.genre = updates.genre.split(",").map((g) => g.trim()).filter(Boolean);
    }
    if (typeof updates.language === "string") {
      updates.language = updates.language.split(",").map((l) => l.trim()).filter(Boolean);
    }
    if (updates.duration !== undefined) {
      updates.duration = Number(updates.duration);
    }
    if (updates.imdbRating !== undefined && updates.imdbRating !== "") {
      updates.imdbRating = Number(updates.imdbRating);
      if (updates.rating === undefined) {
        updates.rating = updates.imdbRating;
      }
    }
    if (updates.bannerUrl === "") {
      updates.bannerUrl = updates.posterUrl || movie.posterUrl;
    }

    movie = await Movie.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Movie updated successfully",
      data: movie,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update movie",
    });
  }
};

/**
 * @desc    Delete movie (Admin only)
 * @route   DELETE /api/movies/:id
 * @access  Admin Protected
 */
const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    await Movie.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Movie deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete movie",
    });
  }
};

/**
 * @desc    Look up movie info and live rating directly from IMDB (OMDb)
 * @route   GET /api/movies/imdb/lookup
 * @access  Public / Admin
 */
const lookupImdb = async (req, res) => {
  try {
    const { title, imdbId, year } = req.query;

    if (!title && !imdbId) {
      return res.status(400).json({
        success: false,
        message: "Please provide either a movie title or IMDB ID",
      });
    }

    const data = await fetchImdbData({ title, imdbId, year });

    if (!data.success) {
      return res.status(404).json({
        success: false,
        message: data.message || "Movie not found on IMDB",
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to query IMDB API",
    });
  }
};

/**
 * @desc    Get real-time live IMDB rating for a specific movie (with optional sync)
 * @route   GET /api/movies/:id/live-rating
 * @access  Public
 */
const getLiveMovieRating = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    // Query live IMDB API using stored imdbId or movie title
    const imdbData = await fetchImdbData({
      title: movie.title,
      imdbId: movie.imdbId,
    });

    if (imdbData.success) {
      // If sync query parameter is provided or if rating has never been synced, update cache in DB
      if (req.query.sync === "true" || !movie.lastImdbSync) {
        if (imdbData.imdbRating) {
          movie.imdbRating = imdbData.imdbRating;
          movie.rating = imdbData.imdbRating;
        }
        if (imdbData.imdbVotes) movie.imdbVotes = imdbData.imdbVotes;
        if (imdbData.imdbId && !movie.imdbId) movie.imdbId = imdbData.imdbId;
        movie.lastImdbSync = new Date();
        await movie.save();
      }

      return res.status(200).json({
        success: true,
        live: true,
        imdbRating: imdbData.imdbRating,
        imdbVotes: imdbData.imdbVotes,
        imdbId: imdbData.imdbId || movie.imdbId,
        lastSync: movie.lastImdbSync,
        awards: imdbData.awards,
      });
    }

    // Fallback to cached movie rating if IMDB live query failed
    res.status(200).json({
      success: true,
      live: false,
      imdbRating: movie.imdbRating || movie.rating,
      imdbVotes: movie.imdbVotes || `${movie.votesCount || 0}`,
      imdbId: movie.imdbId,
      lastSync: movie.lastImdbSync,
      message: "Using cached movie rating",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch live rating",
    });
  }
};

/**
 * @desc    Force sync a movie's rating and metadata with IMDB (Admin only)
 * @route   POST /api/movies/:id/sync-imdb
 * @access  Admin Protected
 */
const syncMovieImdb = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    const imdbData = await fetchImdbData({
      title: movie.title,
      imdbId: movie.imdbId,
    });

    if (!imdbData.success) {
      return res.status(400).json({
        success: false,
        message: imdbData.message || "Could not find matching IMDB record",
      });
    }

    // Update movie fields from real-time IMDB
    if (imdbData.imdbRating) {
      movie.imdbRating = imdbData.imdbRating;
      movie.rating = imdbData.imdbRating;
    }
    if (imdbData.imdbVotes) movie.imdbVotes = imdbData.imdbVotes;
    if (imdbData.votesCount) movie.votesCount = imdbData.votesCount;
    if (imdbData.imdbId) movie.imdbId = imdbData.imdbId;
    movie.lastImdbSync = new Date();

    await movie.save();

    res.status(200).json({
      success: true,
      message: `Successfully synchronized ${movie.title} with IMDB!`,
      data: movie,
      imdb: imdbData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to synchronize with IMDB",
    });
  }
};

module.exports = {
  getMovies,
  getFeaturedMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  lookupImdb,
  getLiveMovieRating,
  syncMovieImdb,
};

