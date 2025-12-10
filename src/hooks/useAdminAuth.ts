import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_STORAGE_KEY = 'adminAuthenticated';

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is authenticated
    const authStatus = localStorage.getItem(ADMIN_STORAGE_KEY);
    setIsAuthenticated(authStatus === 'true');
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    // Check against admin credentials
    if (username === 'n8nbalao' && password === 'Balao2025') {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setIsAuthenticated(false);
    navigate('/');
  };

  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    requireAuth
  };
}

export function checkAdminAuth(): boolean {
  return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
}
