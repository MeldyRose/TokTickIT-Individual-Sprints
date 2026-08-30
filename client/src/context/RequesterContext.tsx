import React, { createContext, useContext, useState, useEffect } from "react";
import { RequesterUser } from "../api";

interface RequesterContextType {
  activeRequester: RequesterUser | null;
  selectRequester: (requester: RequesterUser) => void;
  clearRequester: () => void;
}

const STORAGE_KEY = "toktickit_active_requester";

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export const RequesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRequester, setActiveRequester] = useState<RequesterUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const selectRequester = (requester: RequesterUser) => {
    setActiveRequester(requester);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requester));
    } catch {
      // ignore
      // ignore storage errors
    }
  };

  const clearRequester = () => {
    setActiveRequester(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
      // ignore storage errors
    }
  };

  return (
    <RequesterContext.Provider value={{ activeRequester, selectRequester, clearRequester }}>
      {children}
    </RequesterContext.Provider>
  );
};

export const useRequester = (): RequesterContextType => {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error("useRequester must be used within a RequesterProvider");
  }
  return context;
};
