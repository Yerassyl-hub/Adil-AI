import { post } from '../lib/api';
import type { ChatResponse, ChecklistReference, LawReference, SourceReference } from '../types/chat';
import { getTenantId } from '../config/apiConfig';
export type ChatMessagePayload = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatEndpointResponse = {
  answer?: string;
  reply?: string;
  response?: string;
  output?: string;
  law?: LawReference;
  checklist?: ChecklistReference;
  confidence?: string;
  messages?: Array<{
    role?: string;
    content?: string;
  }>;
  [key: string]: any;
};

const CONFIDENCE_LEVELS: Array<ChatResponse['confidence']> = ['низкая', 'средняя', 'высокая'];

const LANGUAGE_SYSTEM_PROMPTS: Record<string, string> = {
  ru: 'Отвечай на русском языке и используй терминологию российского и казахстанского права.',
  kz: 'Сұрақ қай тілде қойылса, жауапты қазақ тілінде бер.',
  en: 'Please respond in English and stay consistent with the user\'s language.',
};

type ChatOptions = {
  language?: string;
};

const normalizeConfidence = (value?: string): ChatResponse['confidence'] => {
  if (!value) return 'средняя';
  const normalized = value.toLowerCase();
  const match = CONFIDENCE_LEVELS.find((level) => level === normalized);
  return match ?? 'средняя';
};

const extractAnswer = (payload: ChatEndpointResponse): string => {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  if (typeof payload.answer === 'string') return payload.answer;
  if (payload.answer && typeof payload.answer === 'object') {
    const text =
      (payload.answer as any).text ??
      (payload.answer as any).content ??
      (payload.answer as any).reply ??
      (payload.answer as any).answer ??
      '';
    if (typeof text === 'string' && text.trim().length > 0) {
      return text;
    }
  }
  if (typeof payload.reply === 'string') return payload.reply;
  if (typeof payload.response === 'string') return payload.response;
  if (typeof payload.output === 'string') return payload.output;
  if (Array.isArray(payload.messages)) {
    const assistantMessage = [...payload.messages]
      .reverse()
      .find((message) => message.role === 'assistant' && typeof message.content === 'string');
    if (assistantMessage?.content) {
      return assistantMessage.content;
    }
  }
  return '';
};

const extractFromPaths = (source: any, paths: string[][]): any => {
  for (const path of paths) {
    let current = source;
    for (const key of path) {
      if (!current || typeof current !== 'object') {
        current = undefined;
        break;
      }
      current = current[key];
    }
    if (current !== undefined) {
      return current;
    }
  }
  return undefined;
};

const normalizeIndex = (value: any): number | undefined => {
  if (value === null || value === undefined) return undefined;
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? parseInt(value.replace(/\D+/g, ''), 10)
      : undefined;
  if (!numeric || Number.isNaN(numeric) || numeric <= 0) {
    return undefined;
  }
  return numeric;
};

const extractSources = (payload: ChatEndpointResponse): SourceReference[] | undefined => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const answerSources = extractFromPaths(payload, [
    ['answer', 'sources'],
    ['answer', 'references'],
    ['answer', 'citations'],
    ['answer', 'links'],
  ]);

  const rawCandidates =
    answerSources ??
    extractFromPaths(payload, [
      ['metadata', 'sources'],
      ['metadata', 'references'],
      ['metadata', 'citations'],
      ['metadata', 'links'],
      ['extra', 'sources'],
      ['extra', 'references'],
      ['extra', 'citations'],
      ['extra', 'links'],
      ['result', 'sources'],
      ['result', 'references'],
      ['result', 'citations'],
      ['sourceDocuments'],
    ]) ??
    (payload as any).source ??
    payload.sources ??
    payload.references ??
    payload.citations ??
    payload.links ??
    payload.evidence ??
    null;

  if (!rawCandidates) {
    return undefined;
  }

  const sources: SourceReference[] = [];
  let autoIndex = 1;

  const getNextIndex = () => autoIndex++;

  const pushSource = (
    title: string | undefined,
    url: string | undefined,
    snippet?: string,
    referenceIndex?: number
  ) => {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return;
    }
    const cleanTitle =
      typeof title === 'string' && title.trim().length > 0 ? title.trim() : undefined;
    const resolvedIndex = referenceIndex ?? getNextIndex();
    if (referenceIndex && referenceIndex >= autoIndex) {
      autoIndex = referenceIndex + 1;
    }
    sources.push({
      title: cleanTitle ?? url,
      url,
      snippet: typeof snippet === 'string' ? snippet : undefined,
      referenceIndex: resolvedIndex,
    });
  };

  const normalizeObject = (item: any, fallbackIndex?: number) => {
    if (!item || typeof item !== 'object') {
      return;
    }
    const title =
      item.title ??
      item.name ??
      item.site ??
      item.source ??
      item.domain ??
      item.provider ??
      item.label ??
      undefined;
    const url =
      item.url ?? item.link ?? item.href ?? item.sourceUrl ?? item.permalink ?? item.location;
    const snippet = item.snippet ?? item.notes ?? item.description ?? item.summary ?? undefined;
    const explicitIndex =
      normalizeIndex(
        item.index ??
          item.order ??
          item.position ??
          item.ref ??
          item.reference ??
          item.citation ??
          item.citationIndex ??
          item.citation_number ??
          item.citationId ??
          item.id
      ) ?? fallbackIndex;
    if (typeof url === 'string') {
      pushSource(title, url, snippet, explicitIndex);
    }
  };

  if (Array.isArray(rawCandidates)) {
    for (const item of rawCandidates) {
      if (!item) continue;

      if (typeof item === 'string') {
        try {
          const url = new URL(item);
          pushSource(url.hostname, url.toString());
        } catch {
          pushSource(undefined, item);
        }
        continue;
      }

      if (typeof item === 'object') {
        normalizeObject(item);
      }
    }
  } else if (typeof rawCandidates === 'object') {
    for (const [title, value] of Object.entries(rawCandidates)) {
      if (typeof value === 'string') {
        const parsedIndex = normalizeIndex(title);
        pushSource(title, value, undefined, parsedIndex);
      } else if (value && typeof value === 'object') {
        normalizeObject({ title, ...(value as any) }, normalizeIndex(title));
      }
    }
  }

  if (sources.length === 0) {
    return undefined;
  }

  const withIndex = sources.some((item) => item.referenceIndex !== undefined);
  if (withIndex) {
    sources.sort((a, b) => {
      const left = a.referenceIndex ?? 0;
      const right = b.referenceIndex ?? 0;
      return left - right;
    });
  }

  return sources;
};

export async function chat(
  messages: ChatMessagePayload[],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const trimmedMessages = messages
    .filter((message) => message.content?.trim().length)
    .slice(-16);

  const sanitizedMessages: ChatMessagePayload[] = [];

  for (const message of trimmedMessages) {
    const content = message.content.trim();
    if (!content) continue;

    const normalizedRole: ChatMessagePayload['role'] =
      message.role === 'system' || message.role === 'assistant' || message.role === 'user'
        ? message.role
        : 'user';

    const previous = sanitizedMessages[sanitizedMessages.length - 1];

    if (normalizedRole === 'assistant' && !previous) {
      // игнорируем ответы ассистента без предшествующего вопроса
      continue;
    }

    if (previous && previous.role === normalizedRole && normalizedRole !== 'system') {
      if (normalizedRole === 'user') {
        // заменяем предыдущий вопрос на более свежий
        sanitizedMessages[sanitizedMessages.length - 1] = {
          role: normalizedRole,
          content,
        };
      }
      // пропускаем дубликат ассистента
      continue;
    }

    sanitizedMessages.push({
      role: normalizedRole,
      content,
    });
  }

  if (!sanitizedMessages.some((message) => message.role === 'user')) {
    throw new Error('Не найдено ни одного пользовательского сообщения для отправки.');
  }

  const preferredLanguage = options.language;
  const languageInstruction = preferredLanguage
    ? LANGUAGE_SYSTEM_PROMPTS[preferredLanguage] ??
      (preferredLanguage === 'kz'
        ? 'Сұрақ қай тілде қойылса, жауапты қазақ тілінде бер.'
        : preferredLanguage === 'ru'
        ? 'Отвечай на русском языке.'
        : `Please respond in ${preferredLanguage}.`)
    : null;

  const finalMessages: ChatMessagePayload[] = languageInstruction
    ? [{ role: 'system', content: languageInstruction }, ...sanitizedMessages]
    : sanitizedMessages;

  const tenantId = getTenantId();
  const lastUserMessage =
    [...finalMessages].reverse().find((message) => message.role === 'user')?.content ?? '';
  const conversationText = finalMessages
    .map((message) => {
      const content = message.content?.trim();
      if (!content) {
        return null;
      }
      return `${message.role}: ${content}`;
    })
    .filter(Boolean)
    .join('\n\n');

  try {
    const payload: Record<string, any> = {
      messages: finalMessages,
    };

    if (tenantId) {
      payload.tenant_id = tenantId;
    }

    if (preferredLanguage) {
      payload.language = preferredLanguage;
      payload.preferred_language = preferredLanguage;
    }

    if (lastUserMessage) {
      payload.question = lastUserMessage;
    }

    if (conversationText) {
      payload.raw_text = conversationText;
    }

    const data = await post<ChatEndpointResponse>('/v1/chat', payload);

    const answer = extractAnswer(data);

    const sources = extractSources(data);

    return {
      answer,
      confidence: normalizeConfidence(data?.confidence),
      law: data?.law,
      checklist: data?.checklist,
      sources,
    };
  } catch (error: any) {
    const message = error?.message ?? '';

    const isUnauthorized = message.includes('HTTP 401');
    const shouldFallback =
      !isUnauthorized &&
      (message.includes('HTTP') || message.includes('NETWORK'));

    throw error;
  }
}

