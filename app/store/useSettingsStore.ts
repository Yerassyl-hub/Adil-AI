import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Theme, Language } from '../types/common';

interface SettingsState {
  theme: Theme;
  language: Language;
  notificationsEnabled: boolean;
  loggingEnabled: boolean;
  onboarded: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setLoggingEnabled: (enabled: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  clearAllData: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'ru',
      notificationsEnabled: true,
      loggingEnabled: false,
      onboarded: false,

      setTheme: (theme: Theme) => {
        set({ theme });
      },

      setLanguage: (language: Language) => {
        set({ language });
      },

      setNotificationsEnabled: (enabled: boolean) => {
        set({ notificationsEnabled: enabled });
      },

      setLoggingEnabled: (enabled: boolean) => {
        set({ loggingEnabled: enabled });
      },

      setOnboarded: (onboarded: boolean) => {
        set({ onboarded });
      },

      clearAllData: async () => {
        // Clear all AsyncStorage keys used by the app
        const keys = [
          'auth-storage',
          'chat-storage',
          'checklist-storage',
          'docs-storage',
          'calendar-storage',
          'settings-storage',
        ];

        await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));

        // Reset settings to defaults (but keep theme/language preferences)
        set({
          notificationsEnabled: true,
          loggingEnabled: false,
          onboarded: false,
        });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);



