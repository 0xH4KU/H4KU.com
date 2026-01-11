import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, render, screen, waitFor } from '@testing-library/react';
import { ContactForm } from '../ContactForm';

// Mock Turnstile component
let mockTurnstileCallback: ((token: string) => void) | null = null;
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: vi.fn(({ onSuccess }) => {
    mockTurnstileCallback = onSuccess;
    return <div data-testid="turnstile-mock">Turnstile Mock</div>;
  }),
}));

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

const { ContactSubmissionError } = await import('@/services/contact');

describe('ContactForm', () => {
  const baseTime = new Date('2025-01-01T00:00:00.000Z').getTime();
  let now = baseTime;

  beforeEach(() => {
    mockedSubmit.mockReset();
    mockTurnstileCallback = null;
    now = baseTime;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const fillValidForm = async (
    overrides: Partial<Record<'name' | 'email' | 'message', string>> = {}
  ) => {
    const {
      name = 'Tester',
      email = 'user@example.com',
      message = 'Hello',
    } = overrides;
    await userEvent.clear(screen.getByLabelText(/Name/i));
    await userEvent.type(screen.getByLabelText(/Name/i), name);
    await userEvent.clear(screen.getByLabelText(/Email/i));
    await userEvent.type(screen.getByLabelText(/Email/i), email);
    await userEvent.clear(screen.getByLabelText(/Message/i));
    await userEvent.type(screen.getByLabelText(/Message/i), message);
  };

  const simulateTurnstileSuccess = async () => {
    if (mockTurnstileCallback) {
      await act(async () => {
        mockTurnstileCallback?.('mock-turnstile-token');
      });
    }
  };

  const submit = async () => {
    await userEvent.click(
      screen.getByRole('button', { name: /send message/i })
    );
  };

  it('shows validation error for invalid email (requires TLD)', async () => {
    render(<ContactForm />);

    await userEvent.type(screen.getByLabelText(/Name/i), 'Tester');
    await userEvent.type(screen.getByLabelText(/Email/i), 'user@example'); // no TLD
    await userEvent.type(screen.getByLabelText(/Message/i), 'Hello');
    now += 2000; // satisfy minimum fill time
    await simulateTurnstileSuccess();

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
    await simulateTurnstileSuccess();

    await userEvent.click(
      screen.getByRole('button', { name: /send message/i })
    );

    await waitFor(() =>
      expect(mockedSubmit).toHaveBeenCalledWith(
        {
          name: 'Tester',
          email: 'user@example.com',
          message: 'Hello there',
          turnstileToken: 'mock-turnstile-token',
        },
        expect.any(AbortSignal)
      )
    );

    await waitFor(() =>
      expect(
        screen.getByText(/Message sent successfully!.*ref-123/i)
      ).toBeInTheDocument()
    );
  });

  it('does not submit when required fields are missing', async () => {
    render(<ContactForm />);

    const form = screen
      .getByRole('button', { name: /send message/i })
      .closest('form');
    if (!form) {
      throw new Error('Form element not found');
    }
    form.setAttribute('novalidate', 'true');

    now += 2000; // satisfy minimum fill time
    await simulateTurnstileSuccess();
    await submit();

    expect(
      await screen.findByText(/Please fill in all fields/i)
    ).toBeInTheDocument();
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it('blocks bot submissions via honeypot and fakes success', async () => {
    render(<ContactForm />);

    await fillValidForm();
    await userEvent.type(
      screen.getByLabelText(/Website \(please leave this field blank\)/i, {
        selector: 'input',
      }),
      'https://spam.test'
    );
    now += 2000;
    await simulateTurnstileSuccess();

    await submit();

    expect(mockedSubmit).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/Message sent successfully!/i)
    ).toBeInTheDocument();
  });

  it('enforces minimum fill time before submitting', async () => {
    mockedSubmit.mockResolvedValueOnce({ success: true });
    render(<ContactForm />);

    await fillValidForm();
    now += 500; // below 1s threshold
    await simulateTurnstileSuccess();

    await submit();

    expect(mockedSubmit).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/Please take your time filling out the form/i)
    ).toBeInTheDocument();
  });

  it('requires Turnstile verification before submitting', async () => {
    render(<ContactForm />);

    await fillValidForm();
    now += 2000;
    // Do NOT call simulateTurnstileSuccess()

    // Button should be disabled without Turnstile token
    const submitButton = screen.getByRole('button', { name: /send message/i });
    expect(submitButton).toBeDisabled();
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it('surfaces ContactSubmissionError messages', async () => {
    mockedSubmit.mockRejectedValueOnce(
      new ContactSubmissionError('Endpoint misconfigured')
    );

    render(<ContactForm />);
    await fillValidForm();
    now += 2000;
    await simulateTurnstileSuccess();
    await submit();

    expect(
      await screen.findByText(/Endpoint misconfigured/i)
    ).toBeInTheDocument();
  });

  it('handles abort errors gracefully', async () => {
    mockedSubmit.mockRejectedValueOnce(
      new DOMException('Aborted', 'AbortError')
    );

    render(<ContactForm />);
    await fillValidForm();
    now += 2000;
    await simulateTurnstileSuccess();
    await submit();

    expect(
      await screen.findByText(/The request was canceled. Please try again./i)
    ).toBeInTheDocument();
  });

  it('falls back to a generic error message for unknown failures', async () => {
    mockedSubmit.mockRejectedValueOnce(new Error('Network exploded'));

    render(<ContactForm />);
    await fillValidForm();
    now += 2000;
    await simulateTurnstileSuccess();
    await submit();

    expect(mockedSubmit).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(
        /Failed to send message\. Please try again or email directly/i
      )
    ).toBeInTheDocument();
  });
});
