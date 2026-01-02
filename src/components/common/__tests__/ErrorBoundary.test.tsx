import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock the monitoring service
vi.mock('@/services/monitoring', () => ({
  reportError: vi.fn(),
}));

// Mock CSS module to avoid jsdom CSS parsing issues
vi.mock('../ErrorBoundary.module.css', () => ({
  default: {
    'error-container': 'error-container',
    'error-content': 'error-content',
    'error-title': 'error-title',
    'error-message': 'error-message',
    'error-reference': 'error-reference',
    'error-actions': 'error-actions',
    'error-button': 'error-button',
    'error-button-secondary': 'error-button-secondary',
    'error-button-tertiary': 'error-button-tertiary',
    'error-copy-status': 'error-copy-status',
    'error-instructions': 'error-instructions',
    'error-subtitle': 'error-subtitle',
    'error-list': 'error-list',
    helpText: 'helpText',
  },
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Content rendered successfully</div>;
};

// Suppress console.error during tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  vi.clearAllMocks();
});

describe('ErrorBoundary', () => {
  describe('normal rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('catches errors and displays fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('displays error reference ID', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Reference:/)).toBeInTheDocument();
    });

    it('displays custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(
        screen.queryByText('Something went wrong')
      ).not.toBeInTheDocument();
    });

    it('calls onError callback when error occurs', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('reports error to monitoring service', async () => {
      const { reportError } = await import('@/services/monitoring');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(reportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object),
        expect.objectContaining({
          tags: expect.objectContaining({
            referenceId: expect.any(String),
          }),
        })
      );
    });
  });

  describe('recovery actions', () => {
    it('has reset functionality via Try again button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Click "Try again" resets the error boundary state
      const tryAgainButton = screen.getByText('Try again');
      expect(tryAgainButton).toBeInTheDocument();

      // After clicking, the error boundary will try to render children again
      // Since ThrowError still throws, it will catch the error again
      // This test verifies the reset mechanism exists and is clickable
      fireEvent.click(tryAgainButton);

      // The error boundary resets and tries again, catching the same error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows "Reload page" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Reload page')).toBeInTheDocument();
    });

    it('shows "Copy crash report" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Copy crash report')).toBeInTheDocument();
    });
  });

  describe('copy crash report', () => {
    it('copies crash report to clipboard', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('Copy crash report'));

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          expect.stringContaining('H4KU.com crash report')
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText('Crash report copied to clipboard')
        ).toBeInTheDocument();
      });
    });

    it('shows error message when clipboard fails', async () => {
      const mockWriteText = vi
        .fn()
        .mockRejectedValue(new Error('Clipboard error'));
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('Copy crash report'));

      await waitFor(() => {
        expect(
          screen.getByText(/Unable to copy crash report/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('help instructions', () => {
    it('displays help instructions', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('What you can try:')).toBeInTheDocument();
      // Check for the list items using getAllByRole to avoid CSS issues
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(3);
    });

    it('displays support email link', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const emailLink = screen.getByRole('link', { name: /Email support/i });
      expect(emailLink).toHaveAttribute('href', 'mailto:0x@H4KU.com');
    });
  });

  describe('accessibility', () => {
    it('shows action buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Use getAllByRole to find buttons and check their text content
      const buttons = screen.getAllByRole('button');
      const buttonTexts = buttons.map(b => b.textContent);
      expect(buttonTexts).toContain('Try again');
      expect(buttonTexts).toContain('Reload page');
      expect(buttonTexts).toContain('Copy crash report');
    });

    it('uses proper heading hierarchy', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Something went wrong');
    });

    it('marks copy status with appropriate role', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('Copy crash report'));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(
          'Crash report copied to clipboard'
        );
      });
    });
  });
});
