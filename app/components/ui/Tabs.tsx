import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (key: string) => void;
}

export const Tabs: React.FC<TabsProps & { children: (activeTab: string) => React.ReactNode }> = ({
  tabs,
  defaultTab,
  onTabChange,
  children,
}) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key);

  const handleTabPress = (key: string) => {
    setActiveTab(key);
    onTabChange?.(key);
  };

  return (
    <View>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              {
                borderBottomColor: activeTab === tab.key ? colors.primary : 'transparent',
              },
            ]}
            onPress={() => handleTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === tab.key ? colors.primary : colors.textSecondary,
                  fontWeight: activeTab === tab.key ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>{children(activeTab)}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: 16,
  },
  content: {
    paddingTop: 16,
  },
});



