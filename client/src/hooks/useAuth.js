import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check current session on mount
  useEffect(() => {
    let isMounted = true;
    authApi
      .getMe()
      .then((res) => {
        if (isMounted && res.user) {
          setUser(res.user);
        }
      })
      .catch(() => {
        // Unauthenticated session - expected when not logged in
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    const res = await authApi.login({ email, password });
    setUser(res.user);
    return res.user;
  }, []);

  const signup = useCallback(async (data) => {
    setError(null);
    const res = await authApi.signup(data);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
  };
}
