// src/UserContext.jsx
import React, { createContext, useState, useContext } from 'react';

// Create the context
const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores user details (null means no user is logged in)

  // Function to log in a user
  const login = (userData) => {
    setUser(userData);
  };

  // Function to log out a user
  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the context
export const useUser = () => {
  return useContext(UserContext);
};