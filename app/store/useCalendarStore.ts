import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CalendarEvent } from '../types/calendar';

interface CalendarState {
  events: CalendarEvent[];
  reminders: Record<string, string | null>; // eventId -> notificationId
  setEvents: (events: CalendarEvent[]) => void;
  setReminder: (eventId: string, notificationId: string | null) => void;
  clearReminders: () => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      reminders: {},

      setEvents: (events: CalendarEvent[]) => {
        set({ events });
      },

      setReminder: (eventId: string, notificationId: string | null) => {
        set((state) => ({
          reminders: {
            ...state.reminders,
            [eventId]: notificationId,
          },
        }));
      },

      clearReminders: () => {
        set({ reminders: {} });
      },
    }),
    {
      name: 'calendar-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);



