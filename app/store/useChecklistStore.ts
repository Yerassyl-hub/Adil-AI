import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Checklist, ChecklistItem } from '../types/checklist';

interface ChecklistState {
  checklists: Record<string, Checklist>;
  progress: Record<string, Record<string, boolean>>; // checklistId -> itemId -> done
  setChecklist: (checklist: Checklist) => void;
  toggleItem: (checklistId: string, itemId: string) => void;
  updateProgress: (checklistId: string) => void;
  clearProgress: (checklistId: string) => void;
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      checklists: {},
      progress: {},

      setChecklist: (checklist: Checklist) => {
        set((state) => ({
          checklists: {
            ...state.checklists,
            [checklist.id]: checklist,
          },
        }));
        get().updateProgress(checklist.id);
      },

      toggleItem: (checklistId: string, itemId: string) => {
        set((state) => {
          const current = state.progress[checklistId]?.[itemId] || false;
          return {
            progress: {
              ...state.progress,
              [checklistId]: {
                ...(state.progress[checklistId] || {}),
                [itemId]: !current,
              },
            },
          };
        });
        get().updateProgress(checklistId);
      },

      updateProgress: (checklistId: string) => {
        const { checklists, progress } = get();
        const checklist = checklists[checklistId];
        if (!checklist) return;

        const itemProgress = progress[checklistId] || {};
        const doneCount = checklist.items.filter(
          (item) => itemProgress[item.id] !== undefined ? itemProgress[item.id] : item.done
        ).length;
        const totalCount = checklist.items.length;
        const newProgress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

        set((state) => ({
          checklists: {
            ...state.checklists,
            [checklistId]: {
              ...checklist,
              progress: newProgress,
              items: checklist.items.map((item) => ({
                ...item,
                done: itemProgress[item.id] !== undefined ? itemProgress[item.id] : item.done,
              })),
            },
          },
        }));
      },

      clearProgress: (checklistId: string) => {
        set((state) => {
          const newProgress = { ...state.progress };
          delete newProgress[checklistId];
          return { progress: newProgress };
        });
      },
    }),
    {
      name: 'checklist-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);



