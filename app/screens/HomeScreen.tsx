import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { SearchBar } from '../components/common/SearchBar';
import { Card } from '../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { cases } from '../services/client';
import { useAuthStore } from '../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../store/useChatStore';
import { formatDate } from '../utils/date';
interface QuickCase {
  id: string;
  title: string;
  description: string;
  prompt?: string;
}

interface TopQuestion {
  question: string;
  answer: string;
}

interface HomeScreenProps {}

export const HomeScreen: React.FC<HomeScreenProps> = () => {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { me } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCases, setQuickCases] = useState<QuickCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const history = useChatStore((state) => state.history);
  const setFocusMessage = useChatStore((state) => state.setFocusMessage);
  const removeHistoryEntry = useChatStore((state) => state.removeHistoryEntry);
  const clearHistory = useChatStore((state) => state.clearHistory);

  useEffect(() => {
    loadQuickCases();
  }, []);

  const loadQuickCases = async () => {
    try {
      const data = await cases.list();
      setQuickCases(data);
    } catch (error) {
      console.error('Failed to load quick cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      (navigation as any).navigate('Chat', { initialQuery: searchQuery });
    }
  };

  const handleCasePress = (quickCase: QuickCase) => {
    const initialQuery = quickCase.prompt ?? quickCase.title;
    (navigation as any).navigate('Chat', { initialQuery });
  };

  const topQuestions = useMemo(() => {
    const raw = t('home.top_questions', {
      returnObjects: true,
      defaultValue: [],
    }) as Array<{ question?: string; answer?: string }>;

    if (!Array.isArray(raw)) {
      return [];
    }

    return raw
      .slice(0, 10)
      .map((item) => ({
        question: item?.question ?? '',
        answer: item?.answer ?? '',
      }))
      .filter((item) => item.question && item.answer);
  }, [t, i18n.language]);

  const recentHistory = useMemo(() => {
    return [...history].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
  }, [history]);
  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };


  const handleHistoryPress = (messageId: string) => {
    setFocusMessage(messageId);
    (navigation as any).navigate('Chat');
  };

  const handleRemoveRecent = (entryId: string) => {
    Alert.alert(
      t('history.remove_entry_title'),
      t('history.remove_entry_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => removeHistoryEntry(entryId),
        },
      ]
    );
  };

  const handleClearRecent = () => {
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

  const renderQuickCase = ({ item }: { item: QuickCase }) => (
    <TouchableOpacity onPress={() => handleCasePress(item)}>
      <Card style={styles.caseCard}>
        <View style={styles.caseHeader}>
          <Ionicons name="document-text-outline" size={24} color={colors.primary} />
          <Text style={[styles.caseTitle, { color: colors.text }]}>{item.title}</Text>
        </View>
        <Text style={[styles.caseDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {t('home.greeting')}, {me?.name || 'Пользователь'}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            placeholder={t('home.search_placeholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSearch={handleSearch}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('home.quick_cases')}
          </Text>
          {loading ? (
            <Text style={[styles.loading, { color: colors.textSecondary }]}>
              {t('common.loading')}
            </Text>
          ) : (
            <FlatList
              data={quickCases}
              renderItem={renderQuickCase}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.casesList}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.recent')}</Text>
            {recentHistory.length > 0 && (
              <TouchableOpacity
                style={styles.clearRecentButton}
                onPress={handleClearRecent}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <Text style={[styles.clearRecentText, { color: colors.error }]}>
                  {t('history.clear_all')}
                </Text>
               </TouchableOpacity>
             )}
          </View>
          {recentHistory.length === 0 ? (
            <Card>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('home.recent_empty')}
              </Text>
            </Card>
          ) : (
            recentHistory.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentItemWrapper}
                onPress={() => handleHistoryPress(item.answerMessageId)}
              >
                <Card style={styles.recentCard}>
                  <Text style={[styles.recentTimestamp, { color: colors.textSecondary }]}>
                    {formatDate(new Date(item.timestamp))}
                  </Text>
                  <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.question}
                  </Text>
                  <Text style={[styles.recentAnswer, { color: colors.textSecondary }]} numberOfLines={3}>
                    {item.answer}
                  </Text>
                  <TouchableOpacity
                    style={styles.recentDelete}
                    onPress={(event) => {
                      event.stopPropagation();
                      handleRemoveRecent(item.id);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.error} />
                  </TouchableOpacity>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {topQuestions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('home.top_questions_title')}
            </Text>
            <View style={styles.topQuestionsList}>
              {topQuestions.map((item, index) => {
                const isExpanded = !!expandedQuestions[index];
                return (
                  <Card key={`top-question-${index}`} style={styles.topQuestionCard}>
                    <View style={styles.topQuestionHeader}>
                      <Text style={[styles.topQuestionTitle, { color: colors.text }]}>
                        {item.question}
                      </Text>
                      <TouchableOpacity
                        style={styles.answerToggle}
                        onPress={() => toggleQuestion(index)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.answerToggleText, { color: colors.primary }]}>
                          {isExpanded ? t('home.hide_answer') : t('home.show_answer')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {isExpanded ? (
                      <Text style={[styles.topQuestionAnswer, { color: colors.textSecondary }]}>
                        {item.answer}
                      </Text>
                    ) : null}
                  </Card>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    padding: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  topQuestionsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  topQuestionCard: {
    padding: 16,
  },
  topQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  topQuestionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  answerToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  answerToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  topQuestionAnswer: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearRecentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearRecentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  casesList: {
    paddingHorizontal: 16,
  },
  caseCard: {
    width: 200,
    marginRight: 12,
  },
  caseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  caseDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  loading: {
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
  },
  recentItemWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  recentCard: {
    padding: 16,
    position: 'relative',
  },
  recentTimestamp: {
    fontSize: 12,
    marginBottom: 6,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  recentAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
  recentDelete: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});

