import axios from "axios";

// In Vercel serverless / same-domain deployments, '/api' is used directly.
// If VITE_API_URL is set in environment, use that as baseURL.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT Token
API.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem("imovies_user");
    if (userInfo) {
      try {
        const { token } = JSON.parse(userInfo);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Error parsing stored auth credentials", err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error extraction
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default API;

