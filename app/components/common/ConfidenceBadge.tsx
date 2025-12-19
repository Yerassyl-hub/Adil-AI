import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import type { Confidence } from '../../types/common';

interface ConfidenceBadgeProps {
  confidence: Confidence;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const getColor = () => {
    switch (confidence) {
      case 'низкая':
        return colors.confidenceLow;
      case 'средняя':
        return colors.confidenceMid;
      case 'высокая':
        return colors.confidenceHigh;
      default:
        return colors.textSecondary;
    }
  };

  const getLabel = () => {
    switch (confidence) {
      case 'низкая':
        return t('chat.confidence_low');
      case 'средняя':
        return t('chat.confidence_mid');
      case 'высокая':
        return t('chat.confidence_high');
      default:
        return confidence;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getColor() + '20',
          borderColor: getColor(),
        },
      ]}
    >
      <Text style={[styles.text, { color: getColor() }]}>{getLabel()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});



