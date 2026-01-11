import { useState, useEffect, useRef, useMemo, useId, FormEvent } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { mockData } from '@/data/mockData';
import { savePendingContact } from '@/services/contact';
import { isValidEmail, normalizeEmail } from '@/shared/emailValidation';
import styles from './ContactForm.module.css';

const CONTACT_VERIFY_PAGE_ID = 'contact-verify';

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
  const { navigateTo } = useNavigation();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });

  const [status, setStatus] = useState<FormStatus>({ type: 'idle' });
  const statusMessageRef = useRef<HTMLDivElement | null>(null);
  const verifyPage = useMemo(
    () => mockData.pages.find(page => page.id === CONTACT_VERIFY_PAGE_ID),
    []
  );

  // Anti-spam protection (honeypot)
  const [honeypot, setHoneypot] = useState('');
  const [formStartTime, setFormStartTime] = useState<number>(() => Date.now());

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

    try {
      savePendingContact({
        name: formData.name,
        email: normalizedEmail,
        message: formData.message,
      });
    } catch (error) {
      console.error('Failed to save pending contact submission', error);
      setStatus({
        type: 'error',
        message:
          'Could not prepare your submission. Please try again or email contact@H4KU.com',
      });
      return;
    }

    setStatus({
      type: 'loading',
      message: 'Redirecting to verification…',
    });

    setFormStartTime(Date.now());

    if (verifyPage) {
      navigateTo(verifyPage);
    } else {
      window.location.href = '/contact/verify';
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

        <button
          type="submit"
          disabled={status.type === 'loading'}
          className={styles.button}
        >
          {status.type === 'loading' ? 'Redirecting…' : 'Verify & Send'}
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
