import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const STORAGE_KEY = "toktickit_active_requester";
const RequesterContext = createContext(undefined);
export const RequesterProvider = ({ children }) => {
    const [activeRequester, setActiveRequester] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        }
        catch {
            return null;
        }
    });
    const selectRequester = (requester) => {
        setActiveRequester(requester);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(requester));
        }
        catch {
            // ignore
        }
    };
    const clearRequester = () => {
        setActiveRequester(null);
        try {
            localStorage.removeItem(STORAGE_KEY);
        }
        catch {
            // ignore
        }
    };
    return (_jsx(RequesterContext.Provider, { value: { activeRequester, selectRequester, clearRequester }, children: children }));
};
export const useRequester = () => {
    const context = useContext(RequesterContext);
    if (!context) {
        throw new Error("useRequester must be used within a RequesterProvider");
    }
    return context;
};
