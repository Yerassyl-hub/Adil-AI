import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chat as chatService } from '../services/chat';
import type { ChatMessagePayload } from '../services/chat';
import { useSettingsStore } from './useSettingsStore';
import type { Language } from '../types/common';

export type ChatMessageRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  text: string;
  timestamp: number;
  meta?: any;
};

export type ChatHistoryEntry = {
  id: string;
  questionMessageId: string;
  answerMessageId: string;
  question: string;
  answer: string;
  timestamp: number;
};

export type OutgoingAttachment = {
  type: 'image' | 'document';
  name: string;
  url: string;
};

type ChatState = {
  messages: ChatMessage[];
  history: ChatHistoryEntry[];
  focusMessageId: string | null;
  send: (text: string, attachments?: OutgoingAttachment[]) => Promise<void>;
  clear: () => void;
  setFocusMessage: (messageId: string | null) => void;
  removeHistoryEntry: (entryId: string) => void;
  clearHistory: () => void;
};

const safeUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

const buildHistoryFromMessages = (messages: ChatMessage[]): ChatHistoryEntry[] => {
  const result: ChatHistoryEntry[] = [];
  let lastUser: ChatMessage | undefined;

  for (const message of messages) {
    if (message.role === 'user') {
      lastUser = message;
    } else if (message.role === 'assistant') {
      const question = lastUser?.text ?? '';
      const answer =
        (message.meta?.answer && typeof message.meta.answer === 'string'
          ? message.meta.answer
          : message.text) ?? '';

      result.push({
        id: safeUuid(),
        questionMessageId: lastUser?.id ?? message.id,
        answerMessageId: message.id,
        question,
        answer,
        timestamp: message.timestamp,
      });
    }
  }

  return result;
};

const SUMMARY_LABELS: Record<
  Language,
  {
    law: string;
    checklist: string;
    confidence: string;
    stepsSuffix: string;
    confidenceText: Record<'низкая' | 'средняя' | 'высокая', string>;
  }
> = {
  ru: {
    law: 'Закон',
    checklist: 'Чек-лист',
    confidence: 'Уверенность',
    stepsSuffix: 'шагов',
    confidenceText: {
      низкая: 'низкая',
      средняя: 'средняя',
      высокая: 'высокая',
    },
  },
  kz: {
    law: 'Заң',
    checklist: 'Чек-лист',
    confidence: 'Сенімділік',
    stepsSuffix: 'қадам',
    confidenceText: {
      низкая: 'төмен',
      средняя: 'орташа',
      высокая: 'жоғары',
    },
  },
  en: {
    law: 'Law',
    checklist: 'Checklist',
    confidence: 'Confidence',
    stepsSuffix: 'steps',
    confidenceText: {
      низкая: 'low',
      средняя: 'medium',
      высокая: 'high',
    },
  },
};

const ATTACHMENT_LABELS: Record<
  Language,
  {
    header: string;
    document: string;
    image: string;
  }
> = {
  ru: {
    header: 'Вложения',
    document: 'Документ',
    image: 'Изображение',
  },
  kz: {
    header: 'Тіркемелер',
    document: 'Құжат',
    image: 'Сурет',
  },
  en: {
    header: 'Attachments',
    document: 'Document',
    image: 'Image',
  },
};

const detectLanguage = (text: string): Language => {
  if (!text) {
    return useSettingsStore.getState().language;
  }

  const sample = text.slice(0, 200).toLowerCase();
  const kzChars = /[әіңғүұқөһ]/;
  const ruChars = /[ёыэъь]/;
  const latinChars = /[a-z]/;

  if (kzChars.test(sample)) return 'kz';
  if (ruChars.test(sample)) return 'ru';
  if (latinChars.test(sample)) return 'en';
  return useSettingsStore.getState().language;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      history: [],
      focusMessageId: null,
      clear: () =>
        set({
          messages: [],
          history: [],
          focusMessageId: null,
        }),
      setFocusMessage: (messageId: string | null) => set({ focusMessageId: messageId }),
      removeHistoryEntry: (entryId: string) => {
        set((state) => {
          const entry = state.history.find((item) => item.id === entryId);

          if (!entry) {
            return {
              history: state.history.filter((item) => item.id !== entryId),
            };
          }

          const idsToRemove = new Set([entry.questionMessageId, entry.answerMessageId]);
          const nextMessages = state.messages.filter((message) => !idsToRemove.has(message.id));
          return {
            messages: nextMessages,
            history: buildHistoryFromMessages(nextMessages),
            focusMessageId:
              idsToRemove.has(state.focusMessageId ?? '') ? null : state.focusMessageId,
          };
        });
      },
      clearHistory: () =>
        set({
          messages: [],
          history: [],
          focusMessageId: null,
        }),
      send: async (text: string, attachments: OutgoingAttachment[] = []) => {
        const trimmed = text.trim();
        if (!trimmed && attachments.length === 0) {
          return;
        }

        const language = detectLanguage(trimmed);
        const conversationHistory: ChatMessagePayload[] = get().messages.map((message) => ({
          role: message.role,
          content: message.text,
        }));

        const userMsg: ChatMessage = {
          id: safeUuid(),
          role: 'user',
          text: trimmed,
          timestamp: Date.now(),
        };

        set(() => ({
          focusMessageId: null,
        }));

        set((state) => ({
          messages: [...state.messages, userMsg],
        }));

        try {
          const attachmentLocale = ATTACHMENT_LABELS[language] ?? ATTACHMENT_LABELS.ru;
          const attachmentsText =
            attachments.length > 0
              ? `\n\n${attachmentLocale.header}:\n${attachments
                  .map((item, index) => {
                    const label =
                      item.type === 'document'
                        ? attachmentLocale.document
                        : attachmentLocale.image;
                    return `${index + 1}. ${label}: ${item.name} — ${item.url}`;
                  })
                  .join('\n')}`
              : '';

          const content =
            attachmentsText.length > 0
              ? trimmed
                ? `${trimmed}${attachmentsText}`
                : attachmentsText.replace(/^\n+/, '')
              : trimmed;

          const messages: ChatMessagePayload[] = [
            ...conversationHistory,
            {
              role: 'user',
              content,
            },
          ];

          const res = await chatService(messages, { language });
          const summaryLocale = SUMMARY_LABELS[language] ?? SUMMARY_LABELS.ru;
          const localizedConfidence =
            summaryLocale.confidenceText[res.confidence] ?? res.confidence;
          const summaryBlocks = [
            res.answer,
            res.law
              ? `${summaryLocale.law}: ${[res.law.code, res.law.article].filter(Boolean).join(' ')}`
                  .trim()
              : null,
            res.checklist
              ? `${summaryLocale.checklist}: ${res.checklist.title} (${res.checklist.items.length} ${summaryLocale.stepsSuffix})`
              : null,
            `${summaryLocale.confidence}: ${localizedConfidence}`,
          ]
            .filter(Boolean)
            .join('\n');

          const botMsg: ChatMessage = {
            id: safeUuid(),
            role: 'assistant',
            text: summaryBlocks,
            timestamp: Date.now(),
            meta: res,
          };

          set((state) => {
            const nextMessages = [...state.messages, botMsg];
            const historyEntry: ChatHistoryEntry = {
              id: safeUuid(),
              questionMessageId: userMsg.id,
              answerMessageId: botMsg.id,
              question: trimmed,
              answer: res.answer ?? summaryBlocks,
              timestamp: botMsg.timestamp,
            };
            return {
              messages: nextMessages,
              history: [...state.history, historyEntry],
            };
          });
        } catch (error: any) {
          const baseErrorMessage =
            'Извините, сейчас не получилось получить ответ. Попробуйте ещё раз немного позже или переформулируйте вопрос.';
          const technicalDetails =
            __DEV__ && typeof error?.message === 'string' && error.message.length > 0
              ? `\n\n[debug] ${error.message}`
              : '';
          const botMsg: ChatMessage = {
            id: safeUuid(),
            role: 'assistant',
            text: `${baseErrorMessage}${technicalDetails}`,
            timestamp: Date.now(),
          };

          set((state) => ({
            messages: [...state.messages, botMsg],
          }));
        }
      },
    }),
    {
      name: 'adilai-chat',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: async (persistedState: any, version: number) => {
        if (!persistedState) {
          return {
            messages: [],
            history: [],
            focusMessageId: null,
          } as Partial<ChatState>;
        }

        if (version < 1 || !Array.isArray(persistedState.history)) {
          const messages = Array.isArray(persistedState.messages)
            ? persistedState.messages
            : [];
          return {
            messages,
            history: buildHistoryFromMessages(messages),
            focusMessageId: null,
          } as Partial<ChatState>;
        }

        if (version < 2) {
          const messages = Array.isArray(persistedState.messages)
            ? persistedState.messages
            : [];
          return {
            messages,
            history: buildHistoryFromMessages(messages),
            focusMessageId: persistedState.focusMessageId ?? null,
          } as Partial<ChatState>;
        }

        const messages = Array.isArray(persistedState.messages)
          ? persistedState.messages
          : [];
        const history = Array.isArray(persistedState.history)
          ? persistedState.history
          : buildHistoryFromMessages(messages);
        return {
          messages,
          history,
          focusMessageId: persistedState.focusMessageId ?? null,
        } as Partial<ChatState>;
      },
    }
  )
);
