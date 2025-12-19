import { Confidence } from './common';

export interface ChatMessage {
  id: string;
  question: string;
  answer?: string;
  confidence?: Confidence;
  law?: LawReference;
  checklist?: ChecklistReference;
  images?: string[];
  sources?: SourceReference[];
  timestamp: number;
}

export interface LawReference {
  title: string;
  code: string;
  article?: string;
  snippet?: string;
}

export interface ChecklistReference {
  title: string;
  items: Array<{
    text: string;
    done: boolean;
  }>;
}

export interface ChatResponse {
  answer: string;
  confidence: Confidence;
  law?: LawReference;
  checklist?: ChecklistReference;
  sources?: SourceReference[];
}

export interface SourceReference {
  title: string;
  url: string;
  snippet?: string;
  referenceIndex?: number;
}



