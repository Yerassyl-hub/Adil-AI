import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { Tabs } from '../ui/Tabs';
import { Card } from '../ui/Card';
import { useTranslation } from 'react-i18next';
import type { LawReference, ChecklistReference } from '../../types/chat';

interface LawTabsProps {
  law?: LawReference;
  checklist?: ChecklistReference;
}

export const LawTabs: React.FC<LawTabsProps> = ({ law, checklist }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const tabs = [
    { key: 'explanation', label: t('chat.explanation') },
    ...(law ? [{ key: 'law', label: t('chat.law') }] : []),
    ...(checklist ? [{ key: 'checklist', label: t('chat.checklist') }] : []),
  ];

  if (tabs.length === 1) {
    // Only explanation tab, no need for tabs
    return (
      <Card>
        <Text style={[styles.content, { color: colors.text }]}>
          {law?.snippet || 'Дополнительная информация отсутствует'}
        </Text>
      </Card>
    );
  }

  return (
    <Tabs tabs={tabs}>
      {(activeTab) => (
        <View style={styles.content}>
          {activeTab === 'explanation' && (
            <Card>
              <Text style={[styles.text, { color: colors.text }]}>
                {law?.snippet || 'Объяснение отсутствует'}
              </Text>
            </Card>
          )}
          {activeTab === 'law' && law && (
            <Card>
              <Text style={[styles.title, { color: colors.text }]}>{law.title}</Text>
              <Text style={[styles.code, { color: colors.textSecondary }]}>{law.code}</Text>
              {law.article && (
                <Text style={[styles.article, { color: colors.text }]}>
                  {law.article}
                </Text>
              )}
              {law.snippet && (
                <Text style={[styles.snippet, { color: colors.text }]}>{law.snippet}</Text>
              )}
            </Card>
          )}
          {activeTab === 'checklist' && checklist && (
            <Card>
              <Text style={[styles.title, { color: colors.text }]}>{checklist.title}</Text>
              {checklist.items.map((item, index) => (
                <View key={index} style={styles.checklistItem}>
                  <Text
                    style={[
                      styles.checklistText,
                      {
                        color: item.done ? colors.textSecondary : colors.text,
                        textDecorationLine: item.done ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              ))}
            </Card>
          )}
        </View>
      )}
    </Tabs>
  );
};

const styles = StyleSheet.create({
  content: {
    minHeight: 100,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  code: {
    fontSize: 14,
    marginBottom: 8,
  },
  article: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  snippet: {
    fontSize: 14,
    lineHeight: 20,
  },
  checklistItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  checklistText: {
    fontSize: 16,
  },
});



