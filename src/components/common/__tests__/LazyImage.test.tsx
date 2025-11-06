import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LazyImage } from '../LazyImage';

describe('LazyImage', () => {
  it('renders with alt text', () => {
    render(<LazyImage src="/test.jpg" alt="Test image" />);
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
  });

  it('renders with correct src', () => {
    render(<LazyImage src="/test.jpg" alt="Test image" />);
    const img = screen.getByAltText('Test image') as HTMLImageElement;
    expect(img.src).toContain('/test.jpg');
  });
});
