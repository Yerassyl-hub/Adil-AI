import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

type AttachmentPreviewProps = {
  uri?: string;
  type: 'image' | 'document';
  name: string;
  onPreview?: () => void;
  onRemove?: () => void;
};

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  uri,
  type,
  name,
  onPreview,
  onRemove,
}) => {
  const { colors } = useTheme();

  const handlePreview = (event: GestureResponderEvent) => {
    if (!onPreview) return;
    event.stopPropagation();
    onPreview();
  };

  const handleRemove = (event: GestureResponderEvent) => {
    if (!onRemove) return;
    event.stopPropagation();
    onRemove();
  };

  const isImage = type === 'image' && uri;

  return (
    <TouchableOpacity
      activeOpacity={onPreview ? 0.85 : 1}
      onPress={onPreview}
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          shadowColor: colors.cardShadow ?? '#000000',
        },
      ]}
    >
      <View style={styles.actions}>
        {onPreview && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
            onPress={handlePreview}
          >
            <Ionicons
              name={isImage ? 'eye-outline' : 'document-text-outline'}
              size={16}
              color={colors.text}
            />
          </TouchableOpacity>
        )}
        {onRemove && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.background, borderColor: colors.error },
            ]}
            onPress={handleRemove}
          >
            <Ionicons name="close" size={14} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.previewArea}>
        {isImage ? (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.documentPlaceholder}>
            <Ionicons name="document-text-outline" size={28} color={colors.primary} />
          </View>
        )}
      </View>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 120,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
    position: 'relative',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  previewArea: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  documentPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  actions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

