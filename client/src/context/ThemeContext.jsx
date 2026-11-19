import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // 1. Check saved user preference in localStorage
    const savedTheme = localStorage.getItem("imovies_theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    // 2. Default to Dark Mode for immersive cinema experience
    return "dark";
  });

  useEffect(() => {
    // Apply data-theme attribute on root <html> tag for CSS targeting
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("imovies_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
