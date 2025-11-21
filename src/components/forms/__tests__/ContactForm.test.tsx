import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { ContactForm } from '../ContactForm';

vi.mock('@/services/contact', () => {
  return {
    submitContactRequest: vi.fn(),
    ContactSubmissionError: class ContactSubmissionError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'ContactSubmissionError';
      }
    },
  };
});

const mockedSubmit = vi.mocked(
  await import('@/services/contact').then(m => m.submitContactRequest)
);

describe('ContactForm', () => {
  const baseTime = new Date('2025-01-01T00:00:00.000Z').getTime();
  let now = baseTime;

  beforeEach(() => {
    mockedSubmit.mockReset();
    now = baseTime;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows validation error for invalid email (requires TLD)', async () => {
    render(<ContactForm />);

    await userEvent.type(screen.getByLabelText(/Name/i), 'Tester');
    await userEvent.type(screen.getByLabelText(/Email/i), 'user@example'); // no TLD
    await userEvent.type(screen.getByLabelText(/Message/i), 'Hello');
    now += 2000; // satisfy minimum fill time

    await userEvent.click(
      screen.getByRole('button', { name: /send message/i })
    );

    expect(
      await screen.findByText(/Please enter a valid email address/i)
    ).toBeInTheDocument();
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it('submits successfully with valid data and shows reference id', async () => {
    mockedSubmit.mockResolvedValueOnce({
      success: true,
      referenceId: 'ref-123',
    });

    render(<ContactForm />);

    await userEvent.type(screen.getByLabelText(/Name/i), 'Tester');
    await userEvent.type(
      screen.getByLabelText(/Email/i),
      ' user@example.com ' // intentional whitespace trims
    );
    await userEvent.type(screen.getByLabelText(/Message/i), 'Hello there');
    now += 2000; // satisfy minimum fill time

    await userEvent.click(
      screen.getByRole('button', { name: /send message/i })
    );

    await waitFor(() =>
      expect(mockedSubmit).toHaveBeenCalledWith(
        { name: 'Tester', email: 'user@example.com', message: 'Hello there' },
        expect.any(AbortSignal)
      )
    );

    await waitFor(() =>
      expect(
        screen.getByText(/Message sent successfully!.*ref-123/i)
      ).toBeInTheDocument()
    );
  });
});
