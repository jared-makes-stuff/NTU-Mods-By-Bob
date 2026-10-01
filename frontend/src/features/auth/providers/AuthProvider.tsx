'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../state/authStore';

/**
 * Auth Provider Component
 * 
 * Loads user authentication state on app initialization
 * Place this in your root layout
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    // Load user on mount
    loadUser();
  }, [loadUser]);

  return <>{children}</>;
}
