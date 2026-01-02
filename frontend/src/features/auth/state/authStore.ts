/**
 * Authentication Store using Zustand
 * 
 * Global state management for authentication
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginRequest, RegisterRequest, UpdateProfileRequest } from '@/shared/api/types';
import * as authApi from '@/shared/api/auth';
import { getErrorMessage } from '@/shared/api/client';

let loadUserPromise: Promise<void> | null = null;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  loginWithGoogle: (code: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  createPassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasHydrated: false,

      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authApi.login(credentials);
          
          // Set initial user data
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          // Fetch complete user profile with settings (including decrypted credentials)
          try {
            const fullUser = await authApi.getCurrentUser();
            set({ user: fullUser });
          } catch {
            // Continue with basic user data if profile fetch fails
          }
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      loginWithGoogle: async (code: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authApi.loginWithGoogle(code);
          
          // Set initial user data
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          // Fetch complete user profile with settings
          try {
            const fullUser = await authApi.getCurrentUser();
            set({ user: fullUser });
          } catch {
            // Continue with basic user data if profile fetch fails
          }
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authApi.register(data);
          
          // Set initial user data
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          // Fetch complete user profile with settings
          try {
            const fullUser = await authApi.getCurrentUser();
            set({ user: fullUser });
          } catch {
            // Continue with basic user data if profile fetch fails
          }
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      updateProfile: async (data: UpdateProfileRequest) => {
        try {
          set({ isLoading: true, error: null });
          
          const user = await authApi.updateProfile(data);
          
          set({
            user,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      uploadAvatar: async (file: File) => {
        try {
          set({ isLoading: true, error: null });

          const user = await authApi.uploadAvatar(file);

          set({
            user,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          set({ isLoading: true, error: null });

          await authApi.changePassword(currentPassword, newPassword);

          set({
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      createPassword: async (newPassword: string) => {
        try {
          set({ isLoading: true, error: null });

          await authApi.createPassword(newPassword);

          // Update user to reflect they now have a password
          const user = await authApi.getCurrentUser();
          set({
            user,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          
          await authApi.logout();
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch {
          // Still clear local state even if API call fails
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      loadUser: async () => {
        if (loadUserPromise) {
          return loadUserPromise;
        }

        loadUserPromise = (async () => {
          try {
            set({ isLoading: true, error: null });

            const user = await authApi.getCurrentUser();

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch {
            // Token might be invalid, clear everything
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          } finally {
            loadUserPromise = null;
          }
        })();

        return loadUserPromise;
      },

      clearError: () => {
        set({ error: null });
      },

      setHasHydrated: (value: boolean) => {
        set({ hasHydrated: value });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
