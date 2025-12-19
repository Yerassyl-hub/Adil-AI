import { mock } from './mock';
import type { User } from '../types/common';
import type { ChatResponse } from '../types/chat';
import type { Checklist } from '../types/checklist';
import type { CalendarEvent } from '../types/calendar';
import type { DocumentForm, DocumentPreview } from '../types/documents';
import type { ChatMessagePayload } from './chat';
import { chat as chatService } from './chat';
import { uploadDocument } from './documents';

const buildAssistantSummary = (response: ChatResponse): ChatResponse => ({
  answer: response.answer ?? '',
  confidence: response.confidence ?? 'средняя',
  law: response.law,
  checklist: response.checklist,
  sources: response.sources,
});

export const auth = {
  login: async (email: string, password: string) => {
    return mock.auth.login(email, password);
  },

  refresh: async (refreshToken: string) => {
    return mock.auth.refresh(refreshToken);
  },

  me: async (): Promise<User> => {
    return mock.auth.me();
  },
};

export const chat = {
  ask: async (question: string, images?: string[]): Promise<ChatResponse> => {
    const trimmed = question.trim();
    if (!trimmed) {
      return {
        answer: '',
        confidence: 'средняя',
      };
    }

    const messages: ChatMessagePayload[] = [
      {
        role: 'user',
        content: trimmed,
      },
    ];

    try {
      const result = await chatService(messages);
      return buildAssistantSummary(result);
    } catch (error) {
      console.warn('[Chat] Falling back to mock due to error:', error);
      return mock.chat.ask(question, images);
    }
  },
};

export const cases = {
  list: async () => {
    return Promise.resolve(mock.cases.list());
  },
};

export const checklists = {
  get: async (cid: string): Promise<Checklist> => {
    return Promise.resolve(mock.checklists.get(cid));
  },
};

export const laws = {
  search: async (q: string) => {
    return Promise.resolve(mock.laws.search(q));
  },
};

export const calendar = {
  events: async (): Promise<CalendarEvent[]> => {
    return Promise.resolve(mock.calendar.events());
  },
};

export const documents = {
  preview: async (payload: DocumentForm): Promise<DocumentPreview> => {
    return Promise.resolve(mock.documents.preview(payload));
  },
};

export const upload = {
  image: async (fileUri: string): Promise<{ id: string; url: string }> => {
    try {
      const response = await uploadDocument({
        uri: fileUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      });

      return {
        id: response.id ?? `upload_${Date.now()}`,
        url: response.url ?? response.filename ?? fileUri,
      };
    } catch (error) {
      console.warn('[Upload] Falling back to mock due to error:', error);
      return mock.upload.image(fileUri);
    }
  },
};


