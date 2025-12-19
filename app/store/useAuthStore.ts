import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types/common';

// Lazy import to break circular dependency
let authClient: typeof import('../services/client').auth | null = null;
const getAuthClient = () => {
  if (!authClient) {
    authClient = require('../services/client').auth;
  }
  return authClient;
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  me: User | null;
  isAuthorized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  tryRefresh: () => Promise<boolean>;
  bootstrap: () => Promise<void>;
  setMe: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      me: null,
      isAuthorized: false,

      login: async (email: string, password: string) => {
        try {
          const auth = getAuthClient();
          const response = await auth.login(email, password);
          set({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            isAuthorized: true,
          });

          // Fetch user info
          const user = await auth.me();
          set({ me: user });
        } catch (error) {
          console.error('[Auth] Login failed:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          me: null,
          isAuthorized: false,
        });
      },

      tryRefresh: async (): Promise<boolean> => {
        const { refreshToken } = get();
        if (!refreshToken) {
          return false;
        }

        try {
          const auth = getAuthClient();
          const response = await auth.refresh(refreshToken);
          set({
            accessToken: response.access_token,
            refreshToken: response.refresh_token || refreshToken,
            isAuthorized: true,
          });
          return true;
        } catch (error) {
          console.error('[Auth] Refresh failed:', error);
          get().logout();
          return false;
        }
      },

      bootstrap: async () => {
        const { accessToken, refreshToken, tryRefresh } = get();

        // If we have tokens, try to refresh or validate
        if (accessToken || refreshToken) {
          if (refreshToken) {
            const refreshed = await tryRefresh();
            if (refreshed) {
              // Fetch user info
              try {
                const auth = getAuthClient();
                const user = await auth.me();
                set({ me: user, isAuthorized: true });
              } catch (error) {
                console.error('[Auth] Failed to fetch user:', error);
                get().logout();
              }
            }
          } else if (accessToken) {
            // Try to fetch user with existing token
            try {
              const auth = getAuthClient();
              const user = await auth.me();
              set({ me: user, isAuthorized: true });
            } catch (error) {
              console.error('[Auth] Token invalid:', error);
              get().logout();
            }
          }
        }
      },

      setMe: (user: User | null) => {
        set({ me: user });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

