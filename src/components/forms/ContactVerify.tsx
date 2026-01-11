import { useEffect, useMemo, useRef, useState } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useNavigation } from '@/contexts/NavigationContext';
import { mockData } from '@/data/mockData';
import {
  submitContactRequest,
  ContactSubmissionError,
  loadPendingContact,
  clearPendingContact,
  type PendingContactPayload,
} from '@/services/contact';
import styles from './ContactVerify.module.css';

/**
 * Turnstile Site Key - uses test key in E2E/test environments for CI compatibility.
 * Test key '1x00000000000000000000AA' always passes verification.
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAACLxl-ExAnPcpHy3';
const TURNSTILE_BYPASS_TOKEN =
  import.meta.env.VITE_TURNSTILE_BYPASS_TOKEN ?? null;
const SHOULD_RENDER_TURNSTILE = !TURNSTILE_BYPASS_TOKEN;

type VerifyStatus =
  | 'idle'
  | 'verifying'
  | 'verified'
  | 'loading'
  | 'success'
  | 'error';

export function ContactVerify() {
  const { navigateTo } = useNavigation();
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const [pendingPayload, setPendingPayload] =
    useState<PendingContactPayload | null>(null);
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    const payload = loadPendingContact();
    setPendingPayload(payload);
    if (payload && SHOULD_RENDER_TURNSTILE) {
      setStatus('verifying');
      setMessage('Verifying you are human…');
    }
  }, []);

  const contactPage = useMemo(
    () => mockData.pages.find(page => page.id === 'contact'),
    []
  );

  const goBackToContact = () => {
    // Prefer in-app navigation; fallback to URL
    if (contactPage) {
      navigateTo(contactPage);
      return;
    }
    window.location.href = '/page/contact';
  };

  const sendSubmission = async (token: string) => {
    if (!pendingPayload) {
      setStatus('error');
      setMessage(
        'No pending message found. Please return to the contact form and try again.'
      );
      return;
    }

    setStatus('loading');
    setMessage('Sending your message securely…');

    try {
      const result = await submitContactRequest({
        ...pendingPayload,
        turnstileToken: token,
      });

      clearPendingContact();

      const reference = result?.referenceId
        ? ` (reference: ${result.referenceId})`
        : '';
      setStatus('success');
      setMessage(`Message sent successfully!${reference}`);
    } catch (error) {
      if (error instanceof ContactSubmissionError) {
        setMessage(error.message);
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        setMessage('The request was canceled. Please try again.');
      } else {
        setMessage(
          'Failed to send message. Please try again or email contact@H4KU.com'
        );
      }

      setStatus('error');
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  };

  // Auto-send for bypass token (E2E tests)
  useEffect(() => {
    if (pendingPayload && TURNSTILE_BYPASS_TOKEN) {
      void sendSubmission(TURNSTILE_BYPASS_TOKEN);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPayload]);

  const isReady = Boolean(pendingPayload);
  const isProcessing = status === 'verifying' || status === 'loading';

  const handleSend = () => {
    if (turnstileToken) {
      void sendSubmission(turnstileToken);
    }
  };

  const handleRetry = () => {
    setStatus('verifying');
    setMessage('Verifying you are human…');
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <p className={styles.title}>Verify &amp; send</p>
          <p className={styles.subtitle}>
            Complete the verification to send your message.
          </p>
        </div>

        {!isReady && (
          <div className={`${styles.banner} ${styles.error}`}>
            <p>
              No pending message found. Please return to the contact form and
              try again.
            </p>
            <button
              type="button"
              className={styles.linkButton}
              onClick={goBackToContact}
            >
              Back to contact form
            </button>
          </div>
        )}

        {/* Invisible Turnstile - runs in background */}
        {isReady && status !== 'success' && SHOULD_RENDER_TURNSTILE && (
          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={token => {
              setTurnstileToken(token);
              setStatus('verified');
              setMessage('Verification complete. Ready to send.');
            }}
            onError={() => {
              setStatus('error');
              setMessage('Verification failed. Please try again.');
            }}
            onExpire={() => {
              setStatus('error');
              setMessage('Verification expired. Please try again.');
            }}
            options={{
              theme: 'dark',
              size: 'invisible',
            }}
          />
        )}

        {/* Verifying/Loading state */}
        {isProcessing && (
          <div className={`${styles.banner} ${styles.info}`} role="status">
            <span className={styles.spinner} aria-hidden="true" />
            {message}
          </div>
        )}

        {/* Verified - ready to send */}
        {status === 'verified' && (
          <div className={`${styles.banner} ${styles.info}`} role="status">
            {message}
          </div>
        )}

        {status === 'success' && (
          <div className={`${styles.banner} ${styles.success}`} role="status">
            {message ?? 'Message sent successfully!'}
          </div>
        )}

        {status === 'error' && message && (
          <div className={`${styles.banner} ${styles.error}`} role="alert">
            {message}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={goBackToContact}
            disabled={status === 'loading'}
          >
            {status === 'success' ? 'Done' : 'Back'}
          </button>

          {status === 'verified' && (
            <button
              type="button"
              className={styles.primary}
              onClick={handleSend}
            >
              Send
            </button>
          )}

          {status === 'error' && (
            <button
              type="button"
              className={styles.primary}
              onClick={handleRetry}
              disabled={!isReady}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
