import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { fetchAppContext } from '../services/aiService';

const AIAssistantContext = createContext(null);

export const useAIAssistant = () => {
  const ctx = useContext(AIAssistantContext);
  if (!ctx) throw new Error('useAIAssistant must be used within AIAssistantProvider');
  return ctx;
};

export const AIAssistantProvider = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [routine, setRoutine] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);

  const refreshContext = useCallback(async () => {
    if (!user) return { tasks: [], routine: null };
    setContextLoading(true);
    try {
      const ctx = await fetchAppContext();
      setTasks(ctx.tasks);
      setRoutine(ctx.routine);
      return ctx;
    } catch {
      return { tasks: [], routine: null };
    } finally {
      setContextLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setRoutine(null);
      return;
    }
    refreshContext();
  }, [user, refreshKey, refreshContext]);

  const notifyDataChanged = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setDataVersion((v) => v + 1);
  }, []);

  const openAssistant = useCallback(() => {
    setIsOpen(true);
    refreshContext();
  }, [refreshContext]);

  const closeAssistant = useCallback(() => setIsOpen(false), []);

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        openAssistant,
        closeAssistant,
        tasks,
        routine,
        contextLoading,
        refreshContext,
        notifyDataChanged,
        dataVersion,
        getContext: () => ({ tasks, routine }),
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
};
