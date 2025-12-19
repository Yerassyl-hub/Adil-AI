import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { MessageBubble } from '../components/chat/MessageBubble';
import { AnswerBlock } from '../components/chat/AnswerBlock';
import { LawTabs } from '../components/chat/LawTabs';
import { AttachmentPreview } from '../components/chat/AttachmentPreview';
import { useTranslation } from 'react-i18next';
import { useChatStore, type ChatMessage, type OutgoingAttachment } from '../store/useChatStore';
import { pickImage, uploadImage } from '../services/image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { ChatResponse } from '../types/chat';
import * as DocumentPicker from 'expo-document-picker';
import { uploadDocument } from '../services/documents';

type Attachment = {
  id: string;
  type: 'image' | 'document';
  name: string;
  localUri: string;
  remoteUrl: string;
  mimeType?: string;
};

interface ChatScreenProps {
  route?: {
    params?: {
      initialQuery?: string;
      caseId?: string;
      thread?: any[];
    };
  };
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const messages = useChatStore((state) => state.messages);
  const send = useChatStore((state) => state.send);
  const focusMessageId = useChatStore((state) => state.focusMessageId);
  const setFocusMessage = useChatStore((state) => state.setFocusMessage);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const insets = useSafeAreaInsets();
  const canGoBack = navigation?.canGoBack?.() ?? false;
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const createAttachmentId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  useEffect(() => {
    if (!route?.params?.initialQuery) {
      return;
    }

    let isMounted = true;
    setLoading(true);

    send(route.params.initialQuery)
      .catch((error) => {
        console.error('Failed to send initial query:', error);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [route?.params?.initialQuery, send]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

useEffect(() => {
  if (!focusMessageId) {
    return;
  }

  const index = messages.findIndex((message) => message.id === focusMessageId);

  if (index === -1) {
    setFocusMessage(null);
    return;
  }

  let removalTimeout: ReturnType<typeof setTimeout> | undefined;
  const timeout = setTimeout(() => {
    try {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    } catch (error) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }

    setHighlightedMessageId(focusMessageId);
    setFocusMessage(null);

    removalTimeout = setTimeout(() => {
      setHighlightedMessageId((prev) => (prev === focusMessageId ? null : prev));
    }, 4000);
  }, 150);

  return () => {
    clearTimeout(timeout);
    if (removalTimeout) {
      clearTimeout(removalTimeout);
    }
  };
}, [focusMessageId, messages, setFocusMessage]);

  const handleAttachPhoto = async () => {
    try {
      const uri = await pickImage();
      if (uri) {
        const uploaded = await uploadImage(uri);
        setAttachments((prev) => {
          const nextIndex = prev.filter((item) => item.type === 'image').length + 1;
          return [
            ...prev,
            {
              id: uploaded.id ?? createAttachmentId(),
              type: 'image',
              name: t('chat.photo_attachment', { index: nextIndex }),
              localUri: uri,
              remoteUrl: uploaded.url ?? uri,
              mimeType: 'image/jpeg',
            },
          ];
        });
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
    }
  };

  const handleAttachDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      if ('type' in result && result.type === 'cancel') {
        return;
      }

      const asset = Array.isArray(result.assets) ? result.assets[0] : (result as any);

      if (!asset?.uri) {
        return;
      }

      const fallbackName = t('chat.document_attachment');
      const name: string =
        asset.name ??
        (typeof asset?.file?.name === 'string'
          ? asset.file.name
          : `${fallbackName}_${Date.now()}`);

      const mimeType: string = asset.mimeType ?? asset.type ?? 'application/octet-stream';

      const uploadResponse = await uploadDocument({
        uri: asset.uri,
        name,
        type: mimeType,
      });

      const remoteUrl = uploadResponse.url ?? asset.uri;

      setAttachments((prev) => [
        ...prev,
        {
          id: uploadResponse.id ?? createAttachmentId(),
          type: 'document',
          name,
          localUri: asset.uri,
          remoteUrl,
          mimeType,
        },
      ]);
    } catch (error) {
      console.error('Failed to pick document:', error);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePreviewAttachment = async (attachment: Attachment) => {
    const target = attachment.remoteUrl || attachment.localUri;

    if (!target) {
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(target);
      if (canOpen) {
        await Linking.openURL(target);
      } else {
        console.warn('Cannot open attachment url', target);
      }
    } catch (error) {
      console.warn('Failed to open attachment', error);
    }
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    const attachmentsPayload: OutgoingAttachment[] = attachments.map((item) => ({
      type: item.type,
      name: item.name,
      url: item.remoteUrl ?? item.localUri,
    }));

    if (!trimmed && attachmentsPayload.length === 0) {
      return;
    }

    const previousAttachments = attachments;
    setInputText('');
    setAttachments([]);
    setLoading(true);

    try {
      await send(trimmed, attachmentsPayload);
    } catch (error) {
      console.error('Chat send failed:', error);
      setAttachments(previousAttachments);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isHighlighted = highlightedMessageId === item.id;
    if (item.role === 'user') {
      return <MessageBubble message={item.text} isUser={true} highlighted={isHighlighted} />;
    }

    const meta = item.meta as ChatResponse | undefined;

    if (meta) {
      return (
        <View
          style={[
            styles.assistantResponse,
            isHighlighted && {
              borderColor: colors.primary,
              borderWidth: 2,
              borderRadius: 16,
              padding: 4,
            },
          ]}
        >
          <AnswerBlock response={meta} />
          {(meta.law || meta.checklist) && <LawTabs law={meta.law} checklist={meta.checklist} />}
        </View>
      );
    }

    return <MessageBubble message={item.text} isUser={false} highlighted={isHighlighted} />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {canGoBack ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]}>Чат</Text>
        <View style={styles.headerRight} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onScrollToIndexFailed={({ index }) => {
            setTimeout(() => {
              try {
                flatListRef.current?.scrollToIndex({
                  index,
                  animated: true,
                  viewPosition: 0.5,
                });
              } catch {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }, 250);
          }}
        />

        {loading && (
          <View style={styles.thinkingWrapper}>
            <View
              style={[
                styles.thinkingBubble,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>
                {t('chat.thinking')}
              </Text>
            </View>
          </View>
        )}

        {attachments.length > 0 && (
          <View
            style={[
              styles.attachmentsContainer,
              {
                borderTopColor: colors.border,
              },
            ]}
          >
            <FlatList
              horizontal
              data={attachments}
              renderItem={({ item, index }) => (
                <AttachmentPreview
                  type={item.type}
                  name={item.name}
                  uri={item.type === 'image' ? item.localUri : undefined}
                  onPreview={() => handlePreviewAttachment(item)}
                  onRemove={() => handleRemoveAttachment(index)}
                />
              )}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, 12),
              borderTopColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleAttachPhoto}
            style={[styles.attachButton, { backgroundColor: colors.backgroundSecondary }]}
            accessibilityLabel={t('chat.attach_photo')}
            accessibilityRole="button"
          >
            <Ionicons name="camera" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAttachDocument}
            style={[styles.attachButton, { backgroundColor: colors.backgroundSecondary }]}
            accessibilityLabel={t('chat.attach_document')}
            accessibilityRole="button"
          >
            <Ionicons name="document-attach" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                color: colors.text,
                borderColor: colors.inputBorder,
              },
            ]}
            placeholder={t('chat.ask_placeholder')}
            placeholderTextColor={colors.inputPlaceholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={loading || (!inputText.trim() && attachments.length === 0)}
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  loading || (!inputText.trim() && attachments.length === 0)
                    ? colors.border
                    : colors.primary,
              },
            ]}
          >
            <Ionicons name="send" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  headerSpacer: {
    width: 36,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  thinkingWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  thinkingText: {
    fontSize: 14,
  },
  assistantResponse: {
    marginVertical: 8,
  },
  attachmentsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

