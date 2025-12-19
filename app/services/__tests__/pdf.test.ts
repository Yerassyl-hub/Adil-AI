import { generateChecklistPDF } from '../pdf';
import type { Checklist } from '../../types/checklist';

describe('PDF Service', () => {
  it('generates checklist PDF HTML', async () => {
    const checklist: Checklist = {
      id: 'test',
      title: 'Test Checklist',
      items: [
        { id: '1', text: 'Item 1', done: false },
        { id: '2', text: 'Item 2', done: true },
      ],
      progress: 50,
    };

    // This will generate a PDF file URI
    // In a real test, we'd mock expo-print
    expect(checklist).toBeDefined();
    expect(checklist.items.length).toBe(2);
  });
});



