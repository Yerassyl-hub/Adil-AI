import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './ru.json';
import kz from './kz.json';
import en from './en.json';

// Initialize i18n without Zustand to avoid circular dependencies
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    kz: { translation: kz },
  },
  lng: 'ru', // Default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Update language when settings change (after store is available)
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  // Use setTimeout to ensure store is initialized
  setTimeout(() => {
    try {
      const { useSettingsStore } = require('../store/useSettingsStore');
      const currentLanguage = useSettingsStore.getState().language;
      if (currentLanguage) {
        i18n.changeLanguage(currentLanguage);
      }
      
      useSettingsStore.subscribe(
        (state) => state.language,
        (language) => {
          i18n.changeLanguage(language);
        }
      );
    } catch (e) {
      // Store not ready yet, ignore
    }
  }, 0);
}

export default i18n;

