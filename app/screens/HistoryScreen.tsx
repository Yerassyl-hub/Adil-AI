import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useTranslation } from 'react-i18next';
import { useChatStore, type ChatHistoryEntry } from '../store/useChatStore';
import { useNavigation } from '@react-navigation/native';
import { formatDate } from '../utils/date';
import { Ionicons } from '@expo/vector-icons';

interface HistoryScreenProps {}

export const HistoryScreen: React.FC<HistoryScreenProps> = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const history = useChatStore((state) => state.history);
  const setFocusMessage = useChatStore((state) => state.setFocusMessage);
  const removeHistoryEntry = useChatStore((state) => state.removeHistoryEntry);
  const clearHistory = useChatStore((state) => state.clearHistory);
  const navigation = useNavigation();

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => b.timestamp - a.timestamp),
    [history]
  );

  const handleHistoryPress = (entry: ChatHistoryEntry) => {
    setFocusMessage(entry.answerMessageId);
    (navigation as any).navigate('Chat');
  };

  const handleRemoveEntry = (entry: ChatHistoryEntry) => {
    Alert.alert(
      t('history.remove_entry_title'),
      t('history.remove_entry_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => removeHistoryEntry(entry.id),
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      t('history.clear_all_title'),
      t('history.clear_all_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => clearHistory(),
        },
      ]
    );
  };

  const renderHistoryItem = ({ item }: { item: ChatHistoryEntry }) => {
    return (
      <TouchableOpacity onPress={() => handleHistoryPress(item)} activeOpacity={0.8}>
        <Card style={styles.threadCard}>
          <View style={styles.threadHeader}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
            <View style={styles.threadText}>
              <Text style={[styles.threadPreview, { color: colors.text }]} numberOfLines={2}>
                {item.question}
              </Text>
              <Text style={[styles.threadAnswer, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.answer}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(event) => {
                event.stopPropagation();
                handleRemoveEntry(item);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
          <View style={styles.threadFooter}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.threadDate, { color: colors.textSecondary }]}>
              {formatDate(new Date(item.timestamp))}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('history.title')}</Text>
        {sortedHistory.length > 0 && (
          <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={[styles.clearAllText, { color: colors.error }]}>
              {t('history.clear_all')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {sortedHistory.length === 0 ? (
        <EmptyState
          title={t('history.empty')}
          description={t('history.empty_description')}
        />
      ) : (
        <FlatList
          data={sortedHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  threadCard: {
    marginBottom: 12,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  deleteButton: {
    marginLeft: 8,
  },
  threadText: {
    flex: 1,
    gap: 6,
  },
  threadPreview: {
    fontSize: 16,
    fontWeight: '600',
  },
  threadAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
  threadFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  threadDate: {
    fontSize: 12,
  },
});

