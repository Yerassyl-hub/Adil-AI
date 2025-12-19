import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder,
  style,
}) => {
  const { colors } = useTheme();
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={[styles.container, { backgroundColor: colors.inputBackground }, style]}>
      <Text style={[styles.text, { color: selectedOption ? colors.text : colors.inputPlaceholder }]}>
        {selectedOption ? selectedOption.label : placeholder || 'Выберите...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
  },
});



