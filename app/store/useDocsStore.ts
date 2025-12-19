import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DocumentForm } from '../types/documents';

interface DocsState {
  lastFormState: DocumentForm | null;
  previewHtml: string | null;
  setLastFormState: (form: DocumentForm) => void;
  setPreviewHtml: (html: string) => void;
  clear: () => void;
}

export const useDocsStore = create<DocsState>()(
  persist(
    (set) => ({
      lastFormState: null,
      previewHtml: null,

      setLastFormState: (form: DocumentForm) => {
        set({ lastFormState: form });
      },

      setPreviewHtml: (html: string) => {
        set({ previewHtml: html });
      },

      clear: () => {
        set({ lastFormState: null, previewHtml: null });
      },
    }),
    {
      name: 'docs-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);



