import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: number;
  highlighted?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isUser,
  timestamp,
  highlighted = false,
}) => {
  const { colors } = useTheme();

  const highlightStyles = React.useMemo(() => {
    if (!highlighted) {
      return null;
    }

    const borderColor = isUser ? colors.primaryLight : colors.primary;

    return {
      borderWidth: 2,
      borderColor,
      shadowColor: borderColor,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    };
  }, [highlighted, isUser, colors.primary, colors.primaryLight]);

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.backgroundSecondary,
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            ...(highlightStyles ?? {}),
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: isUser ? colors.textInverse : colors.text,
            },
          ]}
        >
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
});



