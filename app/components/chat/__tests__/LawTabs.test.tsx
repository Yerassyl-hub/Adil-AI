import React from 'react';
import { render } from '@testing-library/react-native';
import { LawTabs } from '../LawTabs';

describe('LawTabs', () => {
  it('renders explanation tab by default', () => {
    const { getByText } = render(<LawTabs />);
    // Should show explanation content or placeholder
    expect(getByText(/объяснение|отсутствует/i)).toBeTruthy();
  });

  it('renders law tab when law prop is provided', () => {
    const law = {
      title: 'Test Law',
      code: 'TL',
      article: 'Article 1',
      snippet: 'Test snippet',
    };
    const { getByText } = render(<LawTabs law={law} />);
    expect(getByText('Test Law')).toBeTruthy();
  });
});



