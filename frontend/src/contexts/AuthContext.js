import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('erp_user');
    const token = localStorage.getItem('erp_token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
  const API = process.env.REACT_APP_BACKEND_URL
  ? process.env.REACT_APP_BACKEND_URL + '/api'
  : 'http://127.0.0.1:8000/api';

  const res = await axios.post(
    `${API}/auth/login/`,
    {
      username: username,
      password: password
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  const { access, refresh, user: userData } = res.data;

  localStorage.setItem('erp_token', access);
  localStorage.setItem('erp_refresh', refresh);
  localStorage.setItem('erp_user', JSON.stringify(userData));

  setUser(userData);

  return userData;
};
  const logout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_refresh');
    localStorage.removeItem('erp_user');
    setUser(null);
  };

  const isAuthenticated = !!user;

  const hasRole = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
