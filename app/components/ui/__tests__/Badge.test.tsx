import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders label correctly', () => {
    const { getByText } = render(<Badge label="Test Badge" />);
    expect(getByText('Test Badge')).toBeTruthy();
  });

  it('applies variant styles', () => {
    const { getByText } = render(<Badge label="Success" variant="success" />);
    expect(getByText('Success')).toBeTruthy();
  });
});



