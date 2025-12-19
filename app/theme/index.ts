import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { lightTheme } from './light';
import { darkTheme } from './dark';

export type ThemeColors = typeof lightTheme;

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const { theme } = useSettingsStore();

  const effectiveTheme = theme === 'system' ? systemColorScheme || 'light' : theme;
  const colors = effectiveTheme === 'dark' ? darkTheme : lightTheme;

  return {
    colors,
    isDark: effectiveTheme === 'dark',
  };
};



