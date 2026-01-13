import React, { lazy, Suspense, useState } from 'react';
import paperIcon from '@/assets/paper.gif';
import { useTheme } from '@/contexts/ThemeContext';
import { Page } from '@/types';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import styles from './ContentView.module.css';

const ContactForm = lazy(() =>
  import('@/components/forms/ContactForm').then(module => ({
    default: module.ContactForm,
  }))
);
const ContactVerify = lazy(() =>
  import('@/components/forms/ContactVerify').then(module => ({
    default: module.ContactVerify,
  }))
);

interface TextViewProps {
  page: Page;
  onClose: () => void;
}

function renderContent(content: string): React.ReactNode {
  // Match both "Not available for commissions" (red) and "Available for commissions" (green)
  const parts = content.split(/((?:Not )?[Aa]vailable for commissions)/g);
  return parts.map((part, index) => {
    const lowerPart = part.toLowerCase();
    if (lowerPart === 'not available for commissions') {
      return (
        <span key={index} className={styles['text-unavailable']}>
          {part}
        </span>
      );
    }
    if (lowerPart === 'available for commissions') {
      return (
        <span key={index} className={styles['text-available']}>
          {part}
        </span>
      );
    }
    return part;
  });
}

export const TextView: React.FC<TextViewProps> = ({ page, onClose }) => {
  const { theme } = useTheme();
  const [contactRetryKey, setContactRetryKey] = useState(0);

  const contactFormFallback = (
    <div className={styles['contact-error']} role="alert">
      <p>We could not load the contact form just yet.</p>
      <div className={styles['contact-error-actions']}>
        <button
          type="button"
          className={styles['contact-error-button']}
          onClick={() => setContactRetryKey(prev => prev + 1)}
        >
          Try again
        </button>
        <a
          className={styles['contact-error-link']}
          href="mailto:CONTACT@H4KU.COM"
        >
          Email CONTACT@H4KU.COM
        </a>
      </div>
    </div>
  );

  const contactVerifyFallback = (
    <div className={styles['contact-loading']} role="status">
      Preparing verification…
    </div>
  );

  return (
    <div className={styles['txt-viewer-wrapper']} key={`txt-${page.id}`}>
      <div className={`${styles['txt-viewer']} ${theme}`}>
        <div className={styles['txt-header']}>
          <img
            className={styles['txt-icon']}
            src={paperIcon}
            alt="Text file icon"
            width="36"
            height="36"
          />
          <h1 className={styles['txt-title']}>{page.name}</h1>
          <button onClick={onClose} className={styles['close-btn']}>
            ×
          </button>
        </div>
        <div className={styles['txt-content']}>
          <pre>{renderContent(page.content)}</pre>
          {page.id === 'contact' && (
            <ErrorBoundary key={contactRetryKey} fallback={contactFormFallback}>
              <Suspense
                fallback={
                  <div className={styles['contact-loading']} role="status">
                    Loading secure contact form…
                  </div>
                }
              >
                <ContactForm />
              </Suspense>
            </ErrorBoundary>
          )}
          {page.id === 'contact-verify' && (
            <ErrorBoundary fallback={contactVerifyFallback}>
              <Suspense fallback={contactVerifyFallback}>
                <ContactVerify />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
};
