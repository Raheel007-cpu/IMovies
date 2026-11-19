import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on application start
  useEffect(() => {
    const storedUser = localStorage.getItem("imovies_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (err) {
        console.error("Failed to parse stored user credential", err);
        localStorage.removeItem("imovies_user");
      }
    }
    setLoading(false);
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post("/auth/login", { email, password });
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem("imovies_user", JSON.stringify(userData));
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Login failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (name, email, password, phone) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post("/auth/register", {
        name,
        email,
        password,
        phone,
      });
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem("imovies_user", JSON.stringify(userData));
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Registration failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    localStorage.removeItem("imovies_user");
  };

  // Update profile handler
  const updateProfile = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.put("/auth/profile", formData);
      const updatedData = response.data.data;
      setUser(updatedData);
      localStorage.setItem("imovies_user", JSON.stringify(updatedData));
      return updatedData;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update profile";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAdmin,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

