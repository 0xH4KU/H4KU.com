import React, { lazy, Suspense, useMemo, useState } from 'react';
import { m } from 'framer-motion';
import paperIcon from '@/assets/paper.gif';
import { useTheme } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Page } from '@/types';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import {
  createHeaderAnimation,
  createCloseButtonAnimation,
  createPageVariants,
  DEFAULT_EASE,
} from '@/config/animations';
import styles from './ContentView.module.css';

const ContactForm = lazy(() =>
  import('@/components/forms/ContactForm').then(module => ({
    default: module.ContactForm,
  }))
);

interface TextViewProps {
  page: Page;
  onClose: () => void;
}

export const TextView: React.FC<TextViewProps> = ({ page, onClose }) => {
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [contactRetryKey, setContactRetryKey] = useState(0);

  const pageVariants = useMemo(
    () => createPageVariants(prefersReducedMotion),
    [prefersReducedMotion]
  );

  const headerAnimation = useMemo(
    () => createHeaderAnimation(prefersReducedMotion, DEFAULT_EASE),
    [prefersReducedMotion]
  );

  const closeButtonAnimation = useMemo(
    () => createCloseButtonAnimation(prefersReducedMotion),
    [prefersReducedMotion]
  );

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
        <a className={styles['contact-error-link']} href="mailto:hi@lum.bio">
          Email hi@lum.bio
        </a>
      </div>
    </div>
  );

  return (
    <m.div
      className={styles['txt-viewer-wrapper']}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      key={`txt-${page.id}`}
    >
      <div className={`${styles['txt-viewer']} ${theme}`}>
        <m.div
          className={styles['txt-header']}
          initial={headerAnimation.initial}
          animate={headerAnimation.animate}
          transition={headerAnimation.transition}
        >
          <img
            className={styles['txt-icon']}
            src={paperIcon}
            alt="Text file icon"
            width="36"
            height="36"
          />
          <h1 className={styles['txt-title']}>{page.name}</h1>
          <m.button
            onClick={onClose}
            className={styles['close-btn']}
            {...closeButtonAnimation}
          >
            ×
          </m.button>
        </m.div>
        <m.div
          className={styles['txt-content']}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.15,
            duration: 0.3,
            ease: DEFAULT_EASE,
          }}
        >
          <pre>{page.content}</pre>
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
        </m.div>
      </div>
    </m.div>
  );
};
