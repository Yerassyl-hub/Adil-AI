import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/common/ProgressBar';
import { DeadlinePill } from '../components/common/DeadlinePill';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { checklists } from '../services/client';
import { useChecklistStore } from '../store/useChecklistStore';
import { generateChecklistPDF, sharePDF } from '../services/pdf';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { Checklist, ChecklistItem } from '../types/checklist';

interface ChecklistScreenProps {
  route?: {
    params?: {
      id?: string;
    };
  };
}

export const ChecklistScreen: React.FC<ChecklistScreenProps> = ({ route }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { checklists: storeChecklists, setChecklist, toggleItem, updateProgress } =
    useChecklistStore();
  const [checklist, setChecklistState] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const checklistId = route?.params?.id || 'too_register';

  useEffect(() => {
    loadChecklist();
  }, [checklistId]);

  const loadChecklist = async () => {
    try {
      const data = await checklists.get(checklistId);
      setChecklist(data);
      setChecklist(data);
      updateProgress(checklistId);
    } catch (error) {
      console.error('Failed to load checklist:', error);
      Alert.alert(t('common.error'), 'Не удалось загрузить чек-лист');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (itemId: string) => {
    toggleItem(checklistId, itemId);
    updateProgress(checklistId);
    // Update local state
    if (checklist) {
      const updatedItems = checklist.items.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      );
      setChecklistState({ ...checklist, items: updatedItems });
    }
  };

  const handleExportPDF = async () => {
    if (!checklist) return;

    setExporting(true);
    try {
      const pdfUri = await generateChecklistPDF(checklist);
      await sharePDF(pdfUri, `checklist_${checklistId}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      Alert.alert(t('common.error'), 'Не удалось экспортировать PDF');
    } finally {
      setExporting(false);
    }
  };

  const renderItem = ({ item }: { item: ChecklistItem }) => (
    <TouchableOpacity onPress={() => handleToggleItem(item.id)}>
      <Card style={[styles.itemCard, item.done && styles.itemDone]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemContent}>
            <Ionicons
              name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={item.done ? colors.success : colors.textSecondary}
            />
            <Text
              style={[
                styles.itemText,
                {
                  color: item.done ? colors.textSecondary : colors.text,
                  textDecorationLine: item.done ? 'line-through' : 'none',
                },
              ]}
            >
              {item.text}
            </Text>
          </View>
        </View>
        {(item.dueDate || item.critical) && (
          <View style={styles.itemFooter}>
            {item.dueDate && <DeadlinePill date={item.dueDate} critical={item.critical} />}
            {item.critical && (
              <View style={[styles.criticalBadge, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.criticalText, { color: colors.error }]}>
                  {t('checklist.critical')}
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loading, { color: colors.textSecondary }]}>
          {t('common.loading')}
        </Text>
      </SafeAreaView>
    );
  }

  if (!checklist) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.error }]}>{t('common.error')}</Text>
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{checklist.title}</Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.header}>
        {checklist.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {checklist.description}
          </Text>
        )}
      </View>

      <Card style={styles.progressCard}>
        <Text style={[styles.progressLabel, { color: colors.text }]}>
          {t('checklist.progress')}: {checklist.progress}%
        </Text>
        <ProgressBar progress={checklist.progress} showLabel={false} />
      </Card>

      <FlatList
        data={checklist.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <Button
          title={t('checklist.export_pdf')}
          onPress={handleExportPDF}
          loading={exporting}
          style={styles.exportButton}
          icon={<Ionicons name="download-outline" size={20} color="#fff" />}
        />
      </View>
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
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressCard: {
    margin: 16,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  list: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemDone: {
    opacity: 0.6,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  criticalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  criticalText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  exportButton: {
    width: '100%',
  },
  loading: {
    textAlign: 'center',
    marginTop: 32,
  },
  error: {
    textAlign: 'center',
    marginTop: 32,
  },
});

