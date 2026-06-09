import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, getApiErrorMessage } from '../services/apiService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('userInfo');
        if (raw) setUser(JSON.parse(raw));
      } catch {
        await AsyncStorage.removeItem('userInfo');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    await AsyncStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    await AsyncStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('userInfo');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
