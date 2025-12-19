import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { env } from '../env';
import type { CalendarEvent } from '../types/calendar';
import { formatDate, getRelativeDate } from '../utils/date';

/**
 * Notification service for calendar reminders
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestPermissions = async (): Promise<boolean> => {
  if (!env.NOTIFICATIONS_ENABLED) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

export const scheduleEventReminder = async (
  event: CalendarEvent,
  date: Date
): Promise<string | null> => {
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    console.warn('Notification permissions not granted');
    return null;
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: event.title,
      body: event.description || `Напоминание: ${event.title}`,
      data: { eventId: event.id },
      sound: true,
    },
    trigger: date,
  });

  return identifier;
};

export const cancelReminder = async (identifier: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(identifier);
};

export const cancelAllReminders = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  return Notifications.getAllScheduledNotificationsAsync();
};

// Configure notification channel for Android (only on native platforms)
if (Platform.OS === 'android' && typeof Platform.select !== 'undefined') {
  try {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  } catch (e) {
    // Ignore on web platform
  }
}

