export type Confidence = 'низкая' | 'средняя' | 'высокая';

export type Theme = 'light' | 'dark' | 'system';

export type Language = 'ru' | 'kz' | 'en';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}



