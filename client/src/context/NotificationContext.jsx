import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInvitations = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await api.get('/invitations');
      setInvitations(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Poll every 30 seconds
  useEffect(() => {
    if (!user) { setInvitations([]); return; }
    fetchInvitations();
    const interval = setInterval(fetchInvitations, 30000);
    return () => clearInterval(interval);
  }, [user, fetchInvitations]);

  const acceptInvitation = async (id) => {
    try {
      await api.put(`/invitations/${id}/accept`);
      setInvitations((prev) => prev.filter((inv) => inv._id !== id));
      return true;
    } catch (err) {
      throw err;
    }
  };

  const rejectInvitation = async (id) => {
    try {
      await api.put(`/invitations/${id}/reject`);
      setInvitations((prev) => prev.filter((inv) => inv._id !== id));
      return true;
    } catch (err) {
      throw err;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        invitations,
        pendingCount: invitations.length,
        loading,
        refresh: fetchInvitations,
        acceptInvitation,
        rejectInvitation,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
