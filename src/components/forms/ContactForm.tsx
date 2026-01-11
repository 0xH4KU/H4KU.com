import { useState, useEffect, useRef, useId, FormEvent } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import {
  submitContactRequest,
  ContactSubmissionError,
} from '@/services/contact';
import { isValidEmail, normalizeEmail } from '@/shared/emailValidation';
import styles from './ContactForm.module.css';

/**
 * Turnstile Site Key - uses test key in E2E/test environments for CI compatibility.
 * Test key '1x00000000000000000000AA' always passes verification.
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAACLxl-ExAnPcpHy3';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

export function ContactForm() {
  const statusMessageId = useId();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });

  const [status, setStatus] = useState<FormStatus>({ type: 'idle' });
  const statusMessageRef = useRef<HTMLDivElement | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  // Turnstile token state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  // Anti-spam protection (honeypot)
  const [honeypot, setHoneypot] = useState('');
  const [formStartTime, setFormStartTime] = useState<number>(() => Date.now());

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (status.message && statusMessageRef.current) {
      statusMessageRef.current.focus();
    }
  }, [status]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Honeypot validation - hidden field filled means bot
    if (honeypot) {
      console.warn('Bot detected via honeypot');
      setStatus({
        type: 'success',
        message: "Message sent successfully! I'll get back to you soon.",
      });
      setFormData({ name: '', email: '', message: '' });
      return;
    }

    // Minimum fill time check (1 second)
    const now = Date.now();
    const fillTime = now - formStartTime;
    if (fillTime < 1000) {
      setStatus({
        type: 'error',
        message: 'Please take your time filling out the form',
      });
      return;
    }

    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({
        type: 'error',
        message: 'Please fill in all fields',
      });
      return;
    }

    const normalizedEmail = normalizeEmail(formData.email);

    if (!isValidEmail(normalizedEmail)) {
      setStatus({
        type: 'error',
        message: 'Please enter a valid email address',
      });
      return;
    }

    // Turnstile verification check
    if (!turnstileToken) {
      setStatus({
        type: 'error',
        message: turnstileError || 'Please complete the verification',
      });
      return;
    }

    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;

    setStatus({ type: 'loading' });

    try {
      const result = await submitContactRequest(
        {
          name: formData.name,
          email: normalizedEmail,
          message: formData.message,
          turnstileToken,
        },
        controller.signal
      );

      const reference = result?.referenceId
        ? ` (reference: ${result.referenceId})`
        : '';
      setStatus({
        type: 'success',
        message: `Message sent successfully! I'll get back to you soon.${reference}`,
      });
      setFormStartTime(Date.now());
      setFormData({ name: '', email: '', message: '' });
      // Reset Turnstile for next submission
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus({
          type: 'error',
          message: 'The request was canceled. Please try again.',
        });
        activeRequestRef.current = null;
        setFormStartTime(Date.now());
        return;
      }
      const fallbackMessage =
        error instanceof ContactSubmissionError
          ? error.message
          : 'Failed to send message. Please try again or email directly at contact@H4KU.com';
      console.error('Contact submission error:', error);
      setStatus({
        type: 'error',
        message: fallbackMessage,
      });
      setFormStartTime(Date.now());
      // Reset Turnstile on error for retry
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className={styles.contactForm}>
      <form
        onSubmit={handleSubmit}
        className={styles.form}
        aria-busy={status.type === 'loading'}
        aria-describedby={status.message ? statusMessageId : undefined}
      >
        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>
            Name:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={status.type === 'loading'}
            className={styles.input}
            required
            aria-required="true"
            aria-invalid={status.type === 'error' ? 'true' : 'false'}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={status.type === 'loading'}
            className={styles.input}
            required
            aria-required="true"
            aria-invalid={status.type === 'error' ? 'true' : 'false'}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="message" className={styles.label}>
            Message:
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            disabled={status.type === 'loading'}
            className={styles.textarea}
            rows={6}
            required
            aria-required="true"
            aria-invalid={status.type === 'error' ? 'true' : 'false'}
          />
        </div>

        {/* Honeypot Field - Invisible bot trap */}
        <div
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          <label htmlFor="website">
            Website (please leave this field blank):
          </label>
          <input
            type="text"
            id="website"
            name="website"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Cloudflare Turnstile - Human verification */}
        <div className={styles.field}>
          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={token => {
              setTurnstileToken(token);
              setTurnstileError(null);
            }}
            onError={() => {
              setTurnstileToken(null);
              setTurnstileError('Verification failed. Please try again.');
            }}
            onExpire={() => {
              setTurnstileToken(null);
              setTurnstileError('Verification expired. Please verify again.');
            }}
            options={{
              theme: 'dark',
              size: 'flexible',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={status.type === 'loading' || !turnstileToken}
          className={styles.button}
        >
          {status.type === 'loading' ? 'Sending...' : 'Send Message'}
        </button>

        {status.message && (
          <div
            id={statusMessageId}
            ref={statusMessageRef}
            className={`${styles.message} ${
              status.type === 'success' ? styles.success : styles.error
            }`}
            role="status"
            aria-live={status.type === 'error' ? 'assertive' : 'polite'}
            tabIndex={-1}
          >
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
}
