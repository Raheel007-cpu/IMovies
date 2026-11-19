import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const CityContext = createContext();

export const CityProvider = ({ children }) => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem("imovies_city") || "Mumbai";
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await API.get("/cities");
        const cityList = response.data.data || [];
        setCities(cityList);

        // If stored city is not in list, set to first available
        if (cityList.length > 0) {
          const match = cityList.find(
            (c) => c.name.toLowerCase() === selectedCity.toLowerCase()
          );
          if (!match) {
            setSelectedCity(cityList[0].name);
            localStorage.setItem("imovies_city", cityList[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch cities", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  const changeCity = (cityName) => {
    setSelectedCity(cityName);
    localStorage.setItem("imovies_city", cityName);
  };

  return (
    <CityContext.Provider
      value={{
        cities,
        selectedCity,
        changeCity,
        loading,
      }}
    >
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error("useCity must be used within a CityProvider");
  }
  return context;
};

