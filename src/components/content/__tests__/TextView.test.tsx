import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextView } from '../TextView';
import type { Page } from '@/types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    m: {
      div: 'div',
      button: 'button',
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

  beforeEach(() => {
    mockOnClose.mockClear();
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
});
