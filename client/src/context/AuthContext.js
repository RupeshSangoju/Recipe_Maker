import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  const signup = async (email, password, username) => {
    try {
      // Example in AuthContext.js
      await axios.post(`${process.env.REACT_APP_API_URL}/api/signup`, { email, password, username });
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Signup failed');
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/login`, { email, password });
      setUser(response.data);
      const isNewUser = !user; // If no previous user, it’s a new login
      const message = isNewUser ? `Welcome, ${response.data.username}!` : `Welcome back, ${response.data.username}!`;
      setWelcomeMessage(message);
      setTimeout(() => setWelcomeMessage(''), 3000); // Hide after 3 seconds
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, welcomeMessage }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);