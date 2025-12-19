import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { formatDate, getRelativeDate, isPast, isToday } from '../../utils/date';
import { useSettingsStore } from '../../store/useSettingsStore';

interface DeadlinePillProps {
  date: string | Date;
  critical?: boolean;
}

export const DeadlinePill: React.FC<DeadlinePillProps> = ({ date, critical = false }) => {
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const past = isPast(dateObj);
  const today = isToday(dateObj);
  const relative = getRelativeDate(dateObj, language);

  const getColor = () => {
    if (critical && past) return colors.error;
    if (critical) return colors.warning;
    if (past) return colors.textSecondary;
    if (today) return colors.warning;
    return colors.success;
  };

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: getColor() + '20',
          borderColor: getColor(),
        },
      ]}
    >
      <Text style={[styles.text, { color: getColor() }]}>{relative}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});



