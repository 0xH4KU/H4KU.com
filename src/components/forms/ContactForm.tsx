import { useState, useEffect, useRef, useId, FormEvent } from 'react';
import isEmail from 'validator/lib/isEmail';
import type { IsEmailOptions } from 'validator/lib/isEmail';
import {
  submitContactRequest,
  ContactSubmissionError,
} from '@/services/contact';
import styles from './ContactForm.module.css';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

const EMAIL_VALIDATION_OPTIONS: IsEmailOptions = {
  allow_display_name: false,
  allow_utf8_local_part: true,
  allow_ip_domain: false,
  require_tld: true,
};

const isValidEmailAddress = (email: string) =>
  isEmail(email.trim(), EMAIL_VALIDATION_OPTIONS);

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

  // 🛡️ Anti-spam protection (free safeguards)
  const [honeypot, setHoneypot] = useState(''); // Honeypot field
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0); // Rate limiting
  const [formStartTime, setFormStartTime] = useState<number>(() => Date.now()); // Form start timestamp

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

    // 🛡️ Anti-spam Check 1: Honeypot validation
    // Hidden field filled in means a bot submission
    if (honeypot) {
      console.warn('🤖 Bot detected via honeypot');
      // Pretend success but avoid sending anything
      setStatus({
        type: 'success',
        message: "Message sent successfully! I'll get back to you soon.",
      });
      setFormData({ name: '', email: '', message: '' });
      return;
    }

    // 🛡️ Anti-spam Check 2: Rate limiting
    // Only allow one submission per 60 seconds
    const now = Date.now();
    if (now - lastSubmitTime < 60000) {
      setStatus({
        type: 'error',
        message:
          'Please wait a moment before sending another message (1 minute cooldown)',
      });
      return;
    }

    // 🛡️ Anti-spam Check 3: Minimum fill time
    // Require at least one second before submission to deter instant bot posts
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

    const normalizedEmail = formData.email.trim();

    if (!isValidEmailAddress(normalizedEmail)) {
      setStatus({
        type: 'error',
        message: 'Please enter a valid email address',
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
      setLastSubmitTime(now);
      setFormStartTime(Date.now());
      // Reset form
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // Treat aborted/timeout requests as a safe recoverable state
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
          : 'Failed to send message. Please try again or email directly at hi@lum.bio';
      console.error('Contact submission error:', error);
      setStatus({
        type: 'error',
        message: fallbackMessage,
      });
      setFormStartTime(Date.now());
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

        {/* 🍯 Honeypot Field - Invisible bot trap */}
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

        <button
          type="submit"
          disabled={status.type === 'loading'}
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
