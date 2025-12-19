import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { useTranslation } from 'react-i18next';
import { calendar } from '../services/client';
import { useCalendarStore } from '../store/useCalendarStore';
import { scheduleEventReminder, cancelReminder, requestPermissions } from '../services/notifications';
import { formatDate, getRelativeDate } from '../utils/date';
import { useSettingsStore } from '../store/useSettingsStore';
import type { CalendarCategory, CalendarEvent } from '../types/calendar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface CalendarScreenProps {}

export const CalendarScreen: React.FC<CalendarScreenProps> = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { language } = useSettingsStore();
  const { events, setEvents, reminders, setReminder } = useCalendarStore();
  const [selectedCategory, setSelectedCategory] = useState<CalendarCategory>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await calendar.events();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
      Alert.alert(t('common.error'), 'Не удалось загрузить события');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReminder = async (event: CalendarEvent) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Разрешение', 'Необходимо разрешение на уведомления');
      return;
    }

    const existingReminderId = reminders[event.id];
    if (existingReminderId) {
      await cancelReminder(existingReminderId);
      setReminder(event.id, null);
    } else {
      const eventDate = new Date(event.date);
      eventDate.setHours(9, 0, 0, 0); // Set reminder for 9 AM on event date
      const notificationId = await scheduleEventReminder(event, eventDate);
      if (notificationId) {
        setReminder(event.id, notificationId);
      }
    }
  };

  const filteredEvents = events.filter(
    (event) => selectedCategory === 'all' || event.category === selectedCategory
  );

  const categories: CalendarCategory[] = ['all', 'ip', 'too', 'taxes'];

  const renderEvent = ({ item }: { item: CalendarEvent }) => {
    const hasReminder = !!reminders[item.id];
    const eventDate = new Date(item.date);

    return (
      <Card style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventIcon}>
            <Text style={styles.iconEmoji}>{item.icon || '📅'}</Text>
          </View>
          <View style={styles.eventContent}>
            <Text style={[styles.eventTitle, { color: colors.text }]}>{item.title}</Text>
            {item.description && (
              <Text style={[styles.eventDescription, { color: colors.textSecondary }]}>
                {item.description}
              </Text>
            )}
            <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
              {formatDate(eventDate)} • {getRelativeDate(eventDate, language)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleToggleReminder(item)}
            style={styles.reminderButton}
          >
            <Ionicons
              name={hasReminder ? 'notifications' : 'notifications-outline'}
              size={24}
              color={hasReminder ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.headerBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('calendar.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.categories}>
        <FlatList
          horizontal
          data={categories}
          renderItem={({ item }) => (
            <Chip
              label={t(`calendar.${item}`)}
              selected={selectedCategory === item}
              onPress={() => setSelectedCategory(item)}
              style={styles.categoryChip}
            />
          )}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={[styles.loading, { color: colors.textSecondary }]}>
            {t('common.loading')}
          </Text>
        </View>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title={t('calendar.no_events')}
          description="Нет событий в выбранной категории"
        />
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventsList}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  headerRight: {
    width: 36,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  categories: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    marginRight: 8,
  },
  eventsList: {
    padding: 16,
  },
  eventCard: {
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 32,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  eventDate: {
    fontSize: 12,
    marginTop: 4,
  },
  reminderButton: {
    padding: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    fontSize: 16,
  },
});

