import type { User } from '../types/common';
import type { ChatResponse } from '../types/chat';
import type { Checklist } from '../types/checklist';
import type { CalendarEvent } from '../types/calendar';
import type { DocumentForm, DocumentPreview } from '../types/documents';

/**
 * Mock data service for offline/demo mode
 * Provides deterministic seeded data
 */

const seededRandom = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

export const mock = {
  auth: {
    login: (email: string, password: string) => {
      // Simulate API delay
      return Promise.resolve({
        access_token: `mock_access_${Date.now()}`,
        refresh_token: `mock_refresh_${Date.now()}`,
        token_type: 'Bearer',
        expires_in: 3600,
      });
    },

    refresh: (refreshToken: string) => {
      return Promise.resolve({
        access_token: `mock_access_${Date.now()}`,
        refresh_token: refreshToken, // Keep same refresh token
      });
    },

    me: (): User => {
      return {
        id: '1',
        email: 'user@example.com',
        name: 'Тестовый Пользователь',
      };
    },
  },

  chat: {
    ask: (question: string, images?: string[]): ChatResponse => {
      const rand = seededRandom(question.length);
      const confidences: Array<'низкая' | 'средняя' | 'высокая'> = ['низкая', 'средняя', 'высокая'];
      const confidence = confidences[Math.floor(rand() * 3)];

      return {
        answer: 'Это краткий ответ на ваш юридический вопрос. В соответствии с законодательством РК...',
        confidence,
        law: {
          title: 'Гражданский кодекс РК',
          code: 'ГК РК',
          article: 'Статья 123',
          snippet: 'Текст статьи...',
        },
        checklist: question.toLowerCase().includes('тоо') || question.toLowerCase().includes('too')
          ? {
              title: 'Регистрация ТОО',
              items: [
                { text: 'Подготовить устав', done: false },
                { text: 'Оплатить госпошлину', done: false },
                { text: 'Подать документы в НАО', done: false },
              ],
            }
          : undefined,
      };
    },
  },

  cases: {
    list: () => {
      return [
        {
          id: '1',
          title: 'Регистрация ТОО',
          description: 'Пошаговая инструкция по регистрации товарищества с ограниченной ответственностью',
          prompt:
            'Помоги мне разобраться с регистрацией ТОО в Казахстане: какие шаги, сроки и документы нужны?',
        },
        {
          id: '2',
          title: 'Регистрация ИП',
          description: 'Как зарегистрироваться как индивидуальный предприниматель',
          prompt:
            'Расскажи, как открыть ИП в Казахстане: какие требования, налоги и шаги нужно пройти?',
        },
        {
          id: '3',
          title: 'Налоговые обязательства',
          description: 'Какие налоги нужно платить и когда',
          prompt:
            'Какие основные налоговые обязательства есть у малого бизнеса в Казахстане и когда их платить?',
        },
        {
          id: '4',
          title: 'Трудовой договор',
          description: 'Составление и оформление трудового договора',
          prompt:
            'Помоги подготовить трудовой договор для сотрудника в Казахстане: что обязательно включить?',
        },
      ];
    },
  },

  checklists: {
    get: (cid: string): Checklist => {
      if (cid === 'too_register') {
        return {
          id: 'too_register',
          title: 'Регистрация ТОО',
          description: 'Процесс регистрации товарищества с ограниченной ответственностью',
          items: [
            {
              id: '1',
              text: 'Подготовить устав ТОО',
              done: false,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              critical: true,
            },
            {
              id: '2',
              text: 'Оплатить государственную пошлину',
              done: false,
              dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
              critical: true,
            },
            {
              id: '3',
              text: 'Подать документы в НАО "Государственная корпорация "Правительство для граждан"',
              done: false,
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              critical: true,
            },
            {
              id: '4',
              text: 'Получить свидетельство о государственной регистрации',
              done: false,
              dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: '5',
              text: 'Открыть банковский счёт',
              done: false,
              dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          progress: 0,
        };
      }

      return {
        id: cid,
        title: 'Чек-лист процесса',
        items: [],
        progress: 0,
      };
    },
  },

  laws: {
    search: (q: string) => {
      return [
        {
          title: 'Гражданский кодекс РК',
          code: 'ГК РК',
          article: 'Статья 1',
        },
        {
          title: 'Налоговый кодекс РК',
          code: 'НК РК',
          article: 'Статья 100',
        },
      ];
    },
  },

  calendar: {
    events: (): CalendarEvent[] => {
      const now = new Date();
      return [
        {
          id: '1',
          title: 'Подача налоговой декларации',
          description: 'Срок подачи декларации по ИПН',
          date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'taxes',
          icon: '📊',
          reminder: true,
        },
        {
          id: '2',
          title: 'Обновление регистрации ТОО',
          description: 'Ежегодное обновление данных в НАО',
          date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'too',
          icon: '🏢',
          reminder: false,
        },
        {
          id: '3',
          title: 'Оплата социальных отчислений',
          description: 'Ежемесячный платёж для ИП',
          date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'ip',
          icon: '💳',
          reminder: true,
        },
      ];
    },
  },

  documents: {
    preview: (payload: DocumentForm): DocumentPreview => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .section { margin: 20px 0; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Документ</h1>
          <div class="section">
            <div class="field"><span class="label">Стороны:</span> ${payload.parties?.join(', ') || ''}</div>
            <div class="field"><span class="label">Город:</span> ${payload.city || ''}</div>
            <div class="field"><span class="label">Предмет:</span> ${payload.subject || ''}</div>
            <div class="field"><span class="label">Дата начала:</span> ${payload.dates?.start || ''}</div>
            <div class="field"><span class="label">Дата окончания:</span> ${payload.dates?.end || ''}</div>
          </div>
        </body>
        </html>
      `;
      return { html };
    },
  },

  upload: {
    image: (fileUri: string): { id: string; url: string } => {
      return {
        id: `img_${Date.now()}`,
        url: fileUri, // In real app, this would be a server URL
      };
    },
  },
};



