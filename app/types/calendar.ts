export type CalendarCategory = 'all' | 'ip' | 'too' | 'taxes';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  category: CalendarCategory;
  icon?: string;
  reminder?: boolean;
}



