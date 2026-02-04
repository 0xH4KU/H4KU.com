import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, render, screen, waitFor } from '@testing-library/react';
import { ContactForm } from '../ContactForm';
import { ContactVerify } from '../ContactVerify';
import { ContactSubmissionError } from '@/services/contact';
import { SESSION_STORAGE_KEYS } from '@/config/constants';
import { PAGE_IDS } from '@/config/routes';

const mockNavigateTo = vi.fn();
const mockSavePending = vi.fn();
const mockSubmit = vi.fn();
let mockTurnstileSuccess: ((token: string) => void) | null = null;

vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: () => ({
    navigateTo: mockNavigateTo,
    navigateBack: vi.fn(),
    resetToHome: vi.fn(),
    handleBreadcrumbSelect: vi.fn(),
    currentPath: [],
    currentView: null,
    allFolders: [],
    breadcrumbSegments: [],
    activePath: '',
  }),
}));

vi.mock('@/data/mockData', () => ({
  mockData: {
    pages: [
      { id: 'contact', name: 'Contact', type: 'txt', content: '' },
      {
        id: 'contact-verify',
        name: 'Contact Verify',
        type: 'txt',
        content: '',
      },
    ],
  },
}));

vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: vi.fn(({ onSuccess }) => {
    mockTurnstileSuccess = onSuccess;
    return <div data-testid="turnstile-mock">Turnstile Mock</div>;
  }),
}));

vi.mock('@/services/contact', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/contact')>(
      '@/services/contact'
    );
  return {
    ...actual,
    savePendingContact: (
      ...args: Parameters<typeof actual.savePendingContact>
    ) => {
      mockSavePending(...args);
      return actual.savePendingContact(...args);
    },
    submitContactRequest: (
      ...args: Parameters<typeof actual.submitContactRequest>
    ) => mockSubmit(...args),
  };
});

describe('Contact form -> verification flow', () => {
  const baseTime = new Date('2025-01-01T00:00:00.000Z').getTime();
  let now = baseTime;

  beforeEach(() => {
    mockNavigateTo.mockReset();
    mockSavePending.mockReset();
    mockSubmit.mockReset();
    mockTurnstileSuccess = null;
    now = baseTime;
    sessionStorage.clear();
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

  it('shows validation error for invalid email', async () => {
    render(<ContactForm />);

    await fillValidForm({ email: 'user@example' });
    now += 2000; // satisfy minimum fill time
    await userEvent.click(
      screen.getByRole('button', { name: /verify & send/i })
    );

    expect(
      await screen.findByText(/Please enter a valid email address/i)
    ).toBeInTheDocument();
    expect(mockSavePending).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('enforces minimum fill time', async () => {
    render(<ContactForm />);

    await fillValidForm();
    now += 500; // below 1s threshold
    await userEvent.click(
      screen.getByRole('button', { name: /verify & send/i })
    );

    expect(
      await screen.findByText(/Please take your time filling out the form/i)
    ).toBeInTheDocument();
    expect(mockSavePending).not.toHaveBeenCalled();
  });

  it('stores pending payload and navigates to verification page', async () => {
    render(<ContactForm />);

    await fillValidForm({ email: ' user@example.com ' }); // leading/trailing spaces trimmed
    now += 2000;
    await userEvent.click(
      screen.getByRole('button', { name: /verify & send/i })
    );

    expect(mockSavePending).toHaveBeenCalledWith({
      name: 'Tester',
      email: 'user@example.com',
      message: 'Hello',
    });
    expect(mockNavigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ id: PAGE_IDS.CONTACT_VERIFY })
    );

    expect(
      await screen.findByText(/Redirecting to verification/i)
    ).toBeInTheDocument();
  });

  it('treats honeypot as bot and fakes success without navigation', async () => {
    render(<ContactForm />);

    await fillValidForm();
    await userEvent.type(
      screen.getByLabelText(/Website \(please leave this field blank\)/i, {
        selector: 'input',
      }),
      'https://spam.test'
    );
    now += 2000;
    await userEvent.click(
      screen.getByRole('button', { name: /verify & send/i })
    );

    expect(
      await screen.findByText(/Message sent successfully!/i)
    ).toBeInTheDocument();
    expect(mockSavePending).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });
});

describe('ContactVerify', () => {
  const baseTime = new Date('2025-01-01T00:00:00.000Z').getTime();
  let now = baseTime;

  beforeEach(() => {
    mockSubmit.mockReset();
    mockNavigateTo.mockReset();
    mockTurnstileSuccess = null;
    sessionStorage.clear();
    now = baseTime;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const seedPendingPayload = () => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEYS.CONTACT_PENDING_SUBMISSION,
      JSON.stringify({
        name: 'Tester',
        email: 'user@example.com',
        message: 'Hello',
        createdAt: Date.now(),
      })
    );
  };

  const triggerTurnstile = async (token = 'turnstile-token') => {
    if (mockTurnstileSuccess) {
      await act(async () => {
        mockTurnstileSuccess?.(token);
      });
    }
  };

  it('shows guidance when there is no pending payload', () => {
    render(<ContactVerify />);

    expect(screen.getByText(/No pending message found/i)).toBeInTheDocument();
  });

  it('submits pending payload after Turnstile verification and user clicks Send', async () => {
    seedPendingPayload();
    mockSubmit.mockResolvedValueOnce({ success: true, referenceId: 'ref-123' });

    render(<ContactVerify />);
    await triggerTurnstile();

    // User must click Send after verification
    expect(
      await screen.findByText(/Verification complete/i)
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() =>
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Tester',
        email: 'user@example.com',
        message: 'Hello',
        turnstileToken: 'turnstile-token',
      })
    );

    expect(
      await screen.findByText(/Message sent successfully!.*ref-123/i)
    ).toBeInTheDocument();
    expect(
      sessionStorage.getItem(SESSION_STORAGE_KEYS.CONTACT_PENDING_SUBMISSION)
    ).toBeNull();
  });

  it('shows error when backend rejects submission', async () => {
    seedPendingPayload();
    mockSubmit.mockRejectedValueOnce(
      new ContactSubmissionError('Endpoint misconfigured')
    );

    render(<ContactVerify />);
    await triggerTurnstile();

    // User must click Send after verification
    await screen.findByText(/Verification complete/i);
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(
      await screen.findByText(/Endpoint misconfigured/i)
    ).toBeInTheDocument();
  });
});
