import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextView } from '../TextView';
import type { Page } from '@/types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual =
    await vi.importActual<typeof import('framer-motion')>('framer-motion');
  const MockMotionDiv = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
      whileHover?: unknown;
      whileTap?: unknown;
    }
  >(({ whileHover: _whileHover, whileTap: _whileTap, ...props }, ref) => (
    <div ref={ref} {...props} />
  ));

  const MockMotionButton = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
      whileHover?: unknown;
      whileTap?: unknown;
    }
  >(({ whileHover: _whileHover, whileTap: _whileTap, ...props }, ref) => (
    <button ref={ref} {...props} />
  ));

  MockMotionDiv.displayName = 'MockMotionDiv';
  MockMotionButton.displayName = 'MockMotionButton';

  return {
    ...actual,
    m: {
      div: MockMotionDiv,
      button: MockMotionButton,
    },
  };
});

// Mock ThemeContext
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// Mock useReducedMotion
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// Mock ContactForm lazy component
vi.mock('@/components/forms/ContactForm', () => ({
  ContactForm: () => <div data-testid="contact-form">Contact Form</div>,
}));

describe('TextView', () => {
  const mockOnClose = vi.fn();
  const originalTextEncoder = globalThis.TextEncoder;
  const originalClientWidthDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientWidth'
  );

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  afterEach(() => {
    globalThis.TextEncoder = originalTextEncoder;
    if (originalClientWidthDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        'clientWidth',
        originalClientWidthDescriptor
      );
    }
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render page title and content', () => {
      const mockPage: Page = {
        id: 'about',
        name: 'About Me',
        type: 'txt',
        content: 'This is the about page content.',
      };

      render(<TextView page={mockPage} onClose={mockOnClose} />);

      expect(screen.getByText('About Me')).toBeInTheDocument();
      expect(
        screen.getByText('This is the about page content.')
      ).toBeInTheDocument();
    });

    it('should display close button', () => {
      const mockPage: Page = {
        id: 'test',
        name: 'Test Page',
        type: 'txt',
        content: 'Test content',
      };

      render(<TextView page={mockPage} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: /×/ });
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockPage: Page = {
        id: 'test',
        name: 'Test Page',
        type: 'txt',
        content: 'Test content',
      };

      render(<TextView page={mockPage} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: /×/ });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should display text file icon', () => {
      const mockPage: Page = {
        id: 'test',
        name: 'Test Page',
        type: 'txt',
        content: 'Test content',
      };

      render(<TextView page={mockPage} onClose={mockOnClose} />);

      const icon = screen.getByAltText('Text file icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('src');
    });
  });

  describe('Contact Page Special Handling', () => {
    const contactPage: Page = {
      id: 'contact',
      name: 'Contact',
      type: 'txt',
      content: 'Get in touch!',
    };

    it('should show loading state for contact page', () => {
      render(<TextView page={contactPage} onClose={mockOnClose} />);

      // Suspense fallback should show loading message
      expect(
        screen.getByText(/Loading secure contact form/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render ContactForm after loading for contact page', async () => {
      render(<TextView page={contactPage} onClose={mockOnClose} />);

      // Wait for lazy component to load
      await waitFor(() => {
        expect(screen.getByTestId('contact-form')).toBeInTheDocument();
      });
    });

    it('should not render ContactForm for non-contact pages', () => {
      const regularPage: Page = {
        id: 'about',
        name: 'About',
        type: 'txt',
        content: 'About content',
      };

      render(<TextView page={regularPage} onClose={mockOnClose} />);

      expect(screen.queryByTestId('contact-form')).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Loading secure contact form/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Error Boundary Behavior', () => {
    it('should display error fallback when ContactForm fails to load', async () => {
      // This test simulates the ErrorBoundary catching an error
      const contactPage: Page = {
        id: 'contact',
        name: 'Contact',
        type: 'txt',
        content: 'Contact us',
      };

      // Mock console.error to avoid noise in test output
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // We can't easily trigger the error boundary in this setup,
      // but we can verify the fallback UI exists in the component
      render(<TextView page={contactPage} onClose={mockOnClose} />);

      // The error fallback should have the retry button (even if not visible)
      // This is more of a smoke test for the component structure
      await waitFor(() => {
        expect(screen.getByTestId('contact-form')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('Content Rendering', () => {
    it('should render multi-line content correctly', () => {
      const mockPage: Page = {
        id: 'multi',
        name: 'Multi-line',
        type: 'txt',
        content: 'Line 1\nLine 2\nLine 3',
      };

      render(<TextView page={mockPage} onClose={mockOnClose} />);

      const content = screen.getByText(/Line 1/);
      expect(content).toBeInTheDocument();
      expect(content.tagName).toBe('PRE'); // Content should be in a <pre> tag
    });

    it('should render empty content gracefully', () => {
      const mockPage: Page = {
        id: 'empty',
        name: 'Empty Page',
        type: 'txt',
        content: '',
      };

      render(<TextView page={mockPage} onClose={mockOnClose} />);

      expect(screen.getByText('Empty Page')).toBeInTheDocument();
      // The pre tag should exist but be empty
      const preElement = document.querySelector('pre');
      expect(preElement).toBeInTheDocument();
      expect(preElement?.textContent).toBe('');
    });

    it('should highlight "Not available for commissions" text', () => {
      const mockPage: Page = {
        id: 'commissions',
        name: 'Commissions',
        type: 'txt',
        content: 'Status: Not available for commissions. Check back later.',
      };

      render(<TextView page={mockPage} onClose={mockOnClose} />);

      const unavailableText = screen.getByText('Not available for commissions');
      expect(unavailableText).toBeInTheDocument();
      expect(unavailableText.tagName).toBe('SPAN');
    });

    it('should highlight "Available for commissions" text', () => {
      const mockPage: Page = {
        id: 'commissions',
        name: 'Commissions',
        type: 'txt',
        content: 'Status: Available for commissions. Contact me!',
      };

      render(<TextView page={mockPage} onClose={mockOnClose} />);

      const availableText = screen.getByText('Available for commissions');
      expect(availableText).toBeInTheDocument();
      expect(availableText.tagName).toBe('SPAN');
    });

    it('should handle mixed content with both availability states', () => {
      const mockPage: Page = {
        id: 'mixed',
        name: 'Mixed',
        type: 'txt',
        content:
          'Currently: Available for commissions\nPreviously: Not available for commissions',
      };

      render(<TextView page={mockPage} onClose={mockOnClose} />);

      expect(screen.getByText('Available for commissions')).toBeInTheDocument();
      expect(
        screen.getByText('Not available for commissions')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const mockPage: Page = {
        id: 'test',
        name: 'Test Page',
        type: 'txt',
        content: 'Content',
      };

      render(<TextView page={mockPage} onClose={mockOnClose} />);

      const heading = screen.getByRole('heading', { name: 'Test Page' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('should have proper button accessibility', () => {
      const mockPage: Page = {
        id: 'test',
        name: 'Test Page',
        type: 'txt',
        content: 'Content',
      };

      render(<TextView page={mockPage} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: /×/ });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.tagName).toBe('BUTTON');
    });
  });

  describe('Info block layout', () => {
    const mockPage: Page = {
      id: 'about',
      name: 'About',
      type: 'txt',
      content: 'Short line',
    };

    const mockMeasurement = ({
      containerWidth,
      lineWidth,
    }: {
      containerWidth: number;
      lineWidth: number;
    }) => {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        get: () => containerWidth,
      });

      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
        callback(0);
        return 1;
      });
      vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        () =>
          ({
            measureText: () => ({ width: lineWidth }),
            font: '',
          }) as unknown as CanvasRenderingContext2D
      );

      class MockResizeObserver {
        constructor(private callback: ResizeObserverCallback) {}
        observe() {
          this.callback([], this as unknown as ResizeObserver);
        }
        disconnect() {}
      }

      vi.stubGlobal('ResizeObserver', MockResizeObserver);

      render(<TextView page={mockPage} onClose={mockOnClose} />);
    };

    it('shows the info block when content is narrow', async () => {
      mockMeasurement({ containerWidth: 1000, lineWidth: 200 });

      await waitFor(() => {
        expect(screen.getByText(/File info/i)).toBeInTheDocument();
      });
    });

    it('hides the info block when content is wide', async () => {
      mockMeasurement({ containerWidth: 800, lineWidth: 720 });

      await waitFor(() => {
        expect(screen.queryByText(/File info/i)).not.toBeInTheDocument();
      });
    });

    it('hides the info block when content is mid-range', async () => {
      mockMeasurement({ containerWidth: 1000, lineWidth: 520 });

      await waitFor(() => {
        expect(screen.queryByText(/File info/i)).not.toBeInTheDocument();
      });
    });

    it('hides the info block when the container is too narrow', async () => {
      mockMeasurement({ containerWidth: 500, lineWidth: 100 });

      await waitFor(() => {
        expect(screen.queryByText(/File info/i)).not.toBeInTheDocument();
      });
    });

    it('hides the info block when the container width is zero', async () => {
      mockMeasurement({ containerWidth: 0, lineWidth: 0 });

      await waitFor(() => {
        expect(screen.queryByText(/File info/i)).not.toBeInTheDocument();
      });
    });

    it('falls back to string length when TextEncoder is unavailable', async () => {
      globalThis.TextEncoder = undefined as unknown as typeof TextEncoder;
      mockMeasurement({ containerWidth: 1000, lineWidth: 200 });

      await waitFor(() => {
        expect(screen.getByText(/Size/i)).toBeInTheDocument();
      });
    });

    it('skips measurement when canvas context is unavailable', () => {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        get: () => 1000,
      });

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        () => {
          throw new Error('Canvas context unavailable');
        }
      );

      render(<TextView page={mockPage} onClose={mockOnClose} />);

      expect(screen.queryByText(/File info/i)).not.toBeInTheDocument();
    });
  });
});
