import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, loginWithGoogle, loginAsGuest, logout as logoutRequest } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (credential) => {
    const nextUser = await loginWithGoogle(credential);
    setUser(nextUser);
    return nextUser;
  };

  const continueAsGuest = async () => {
    try {
      const nextUser = await loginAsGuest();
      setUser(nextUser);
      return nextUser;
    } catch {
      // Offline/local fallback user state
      const fallbackUser = {
        id: '000000000000000000000001',
        name: 'Field Investigator (Demo)',
        email: 'investigator@proofpoint.local',
        role: 'user',
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  const signOut = async () => {
    try {
      await logoutRequest();
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, continueAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
