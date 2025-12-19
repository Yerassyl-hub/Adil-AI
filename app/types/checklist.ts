export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  dueDate?: string;
  critical?: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  description?: string;
  items: ChecklistItem[];
  progress: number; // 0-100
}



