import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { useTranslation } from 'react-i18next';
import type { ChatResponse, SourceReference } from '../../types/chat';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

interface AnswerBlockProps {
  response: ChatResponse;
}

const normalizeSourceUrl = (raw?: string): string | undefined => {
  if (!raw || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const withScheme = (() => {
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^\/\//.test(trimmed)) return `https:${trimmed}`;
    return `https://${trimmed.replace(/^\/+/, '')}`;
  })();

  try {
    const url = new URL(withScheme);
    return url.toString();
  } catch {
    return undefined;
  }
};

const extractHostname = (raw?: string): string | undefined => {
  const normalized = normalizeSourceUrl(raw);
  if (!normalized) return undefined;
  try {
    return new URL(normalized).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
};

const openLink = (url: string | undefined) => {
  const normalized = normalizeSourceUrl(url);
  if (!normalized) return;

  Linking.canOpenURL(normalized)
    .then((supported) => supported && Linking.openURL(normalized))
    .catch(() => {
      // ignore errors silently for now
    });
};

export const AnswerBlock: React.FC<AnswerBlockProps> = ({ response }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const sources = response.sources ?? [];
  const [activeSource, setActiveSource] = useState<SourceReference | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [webPreviewLoading, setWebPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const resolveSourceByIndex = useCallback(
    (index: number): SourceReference | undefined => {
      if (!sources.length) return undefined;

      const byReferenceIndex = sources.find(
        (item) => item?.referenceIndex !== undefined && item.referenceIndex === index
      );
      if (byReferenceIndex) {
        return byReferenceIndex;
      }

      const byLegacyId = sources.find((item) => {
        if (!item) return false;
        const id =
          (item as any).id ??
          (item as any).index ??
          (item as any).ref ??
          (item as any).citation ??
          (item as any).position ??
          (item as any).order;
        if (id === undefined) return false;
        const numeric =
          typeof id === 'string' ? parseInt(id.replace(/\D+/g, ''), 10) : Number(id);
        if (!numeric || Number.isNaN(numeric)) {
          return false;
        }
        return numeric === index;
      });
      if (byLegacyId) {
        return byLegacyId;
      }

      if (index > 0 && index <= sources.length) {
        return sources[index - 1];
      }

      if (sources.length) {
        return sources[Math.min(sources.length - 1, Math.max(0, index - 1))];
      }

      return undefined;
    },
    [sources]
  );

  const handleSourcePress = useCallback((source: SourceReference | undefined) => {
    if (!source) return;
    const normalized = normalizeSourceUrl(source.url);
    setActiveSource(source);
    setPreviewUrl(normalized ?? null);
    setWebPreviewLoading(!!normalized);
    setModalVisible(true);
  }, []);

  const markdownRules = useMemo(
    () => ({
      text: (node: any, _children: any, _parent: any, styles: any) => {
        const content: string = node.content ?? '';
        const segments = content.split(/(\[\d+\])/g);

        if (segments.length === 1) {
          return (
            <Text key={node.key} style={styles.body}>
              {content}
            </Text>
          );
        }

        return (
          <Text key={node.key} style={styles.body}>
            {segments.map((segment, index) => {
              const match = segment.match(/^\[(\d+)\]$/);
              if (match) {
                const refIndex = parseInt(match[1], 10);
                const referencedSource = resolveSourceByIndex(refIndex);
                const handlePress = () => handleSourcePress(referencedSource);

                return (
                  <Text
                    key={`${node.key}-ref-${index}`}
                    style={styles.reference}
                    onPress={handlePress}
                  >
                    [{match[1]}]
                  </Text>
                );
              }

              return segment ? (
                <Text key={`${node.key}-txt-${index}`} style={styles.body}>
                  {segment}
                </Text>
              ) : null;
            })}
          </Text>
        );
      },
    }),
    [handleSourcePress, resolveSourceByIndex]
  );

  return (
    <Card style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('chat.answer')}</Text>
        <ConfidenceBadge confidence={response.confidence} />
      </View>
      <Markdown
        style={markdownStyles(colors)}
        rules={markdownRules}
        onLinkPress={(url) => {
          openLink(url);
          return false;
        }}
      >
        {response.answer}
      </Markdown>

      {sources.length > 0 && (
        <View
          style={[
            styles.sourcesContainer,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.sourcesHeader}>
            <Text style={[styles.sourcesTitle, { color: colors.text }]}>
              {t('chat.sources')}
            </Text>
            <Text style={[styles.sourcesCount, { color: colors.textSecondary }]}>
              {sources.length}
            </Text>
          </View>
          {sources.map((source: SourceReference, index: number) => (
            <TouchableOpacity
              key={`${source.url}-${source.referenceIndex ?? index}`}
              style={[
                styles.sourceRow,
                index < sources.length - 1 && { borderBottomColor: colors.border },
                styles.sourceRowHighlight,
              ]}
              onPress={() => handleSourcePress(source)}
              activeOpacity={0.85}
            >
              <View style={[styles.referenceBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.referenceBadgeText, { color: colors.textInverse }]}>
                  {source.referenceIndex ?? index + 1}
                </Text>
              </View>
              <View style={styles.sourceIcon}>
                <Ionicons name="link" size={16} color={colors.textSecondary} />
              </View>
              <View style={styles.sourceBody}>
                <Text
                  style={[styles.sourceTitle, { color: colors.primary }]}
                  numberOfLines={1}
                >
                  {source.title || source.url}
                </Text>
                <Text style={[styles.sourceUrl, { color: colors.textSecondary }]} numberOfLines={1}>
                  {extractHostname(source.url) ?? source.url}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Modal
        transparent
        visible={modalVisible && !!activeSource}
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setActiveSource(null);
          setWebPreviewLoading(false);
          setPreviewUrl(null);
        }}
      >
        <View style={styles.modalRoot} pointerEvents="box-none">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setModalVisible(false);
              setActiveSource(null);
              setWebPreviewLoading(false);
              setPreviewUrl(null);
            }}
            pointerEvents="auto"
          />
          {activeSource && (
            <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Ionicons name="globe-outline" size={20} color={colors.primary} />
                <TouchableOpacity
                  style={styles.modalDomainButton}
                  onPress={() => openLink(previewUrl ?? activeSource.url)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalDomain, { color: colors.primary }]}>
                    {extractHostname(activeSource.url) ?? activeSource.url}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={3}>
                {activeSource.title ?? activeSource.url}
              </Text>
              {activeSource.snippet ? (
                <Text
                  style={[styles.modalSnippet, { color: colors.textSecondary }]}
                  numberOfLines={4}
                >
                  {activeSource.snippet}
                </Text>
              ) : null}
              {previewUrl ? (
                <View style={styles.webPreviewWrapper}>
                  {webPreviewLoading && (
                    <View style={[styles.webPreviewOverlay, { backgroundColor: colors.card }]}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  )}
                  <WebView
                    source={{ uri: previewUrl }}
                    style={styles.webPreview}
                    onLoadEnd={() => setWebPreviewLoading(false)}
                    onError={() => setWebPreviewLoading(false)}
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.webPreviewWrapper,
                    styles.webPreviewFallback,
                    { borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.webPreviewFallbackText, { color: colors.textSecondary }]}>
                    {t('chat.source_unavailable')}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.modalLinkButton, { backgroundColor: colors.primary }]}
                onPress={() => openLink(previewUrl ?? activeSource.url)}
                activeOpacity={0.9}
              >
                <Ionicons name="open-outline" size={16} color={colors.textInverse} />
                <Text style={[styles.modalLinkText, { color: colors.textInverse }]}>
                  {t('chat.open_source')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </Card>
  );
};

const markdownStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    body: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 12,
    },
    bullet_list: {
      marginBottom: 12,
    },
    bullet_list_icon: {
      color: colors.primary,
    },
    bullet_list_content: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
    },
    link: {
      color: colors.primary,
    },
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginBottom: 12,
    },
    table_header: {
      backgroundColor: colors.backgroundSecondary,
    },
    table_row: {
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    table_header_cell: {
      fontWeight: '600',
      color: colors.text,
      padding: 8,
    },
    table_cell: {
      color: colors.text,
      padding: 8,
    },
    code_inline: {
      backgroundColor: colors.backgroundSecondary,
      color: colors.text,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    reference: {
      color: colors.primary,
      fontWeight: '700',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginHorizontal: 2,
      backgroundColor: 'rgba(59, 130, 246, 0.12)',
    },
  });

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  sourcesContainer: {
    marginTop: 16,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourcesTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  sourcesCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  sourceRowHighlight: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  referenceBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  referenceBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sourceIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    marginRight: 12,
  },
  sourceBody: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  sourceUrl: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  modalRoot: {
    flex: 1,
    position: 'relative',
  },
  modalCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 40,
    borderRadius: 18,
    padding: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalDomainButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  modalDomain: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSnippet: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
  },
  modalLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  webPreviewWrapper: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  webPreview: {
    flex: 1,
  },
  webPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  webPreviewFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  webPreviewFallbackText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
