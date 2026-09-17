import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthUser, loginUser, logoutUser, getCurrentUser, changePasswordUser } from "../api";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getInitialUser = (): AuthUser | null => {
  try {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("toktickit_active_requester") : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.id && parsed.name) {
        return {
          id: parsed.id,
          name: parsed.name,
          email: parsed.email || "requester@example.com",
          role: "REQUESTER",
          mustChangePassword: false,
        };
      }
    }
  } catch {}
  return null;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getInitialUser());
  const [isLoading, setIsLoading] = useState<boolean>(() => !getInitialUser());

  const resolveUser = async (): Promise<AuthUser | null> => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        return currentUser;
      }
    } catch {}

    return getInitialUser();
  };

  const refreshUser = async () => {
    const resolved = await resolveUser();
    setUser(resolved);
  };

  useEffect(() => {
    const syncUser = getInitialUser();
    if (syncUser) {
      setUser(syncUser);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    resolveUser()
      .then((resolved) => {
        setUser(resolved);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const authUser = await loginUser(email, password);
    setUser(authUser);
    setIsLoading(false);
    return authUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutUser();
    } catch {}
    localStorage.removeItem("toktickit_active_requester");
    setUser(null);
    setIsLoading(false);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword?: string
  ): Promise<void> => {
    await changePasswordUser(currentPassword, newPassword, confirmNewPassword);
    if (user) {
      setUser({ ...user, mustChangePassword: false });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
