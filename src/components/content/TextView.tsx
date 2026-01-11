import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  const prefersReducedMotion = useReducedMotion();
  const [contactRetryKey, setContactRetryKey] = useState(0);
  const [showInfoBlock, setShowInfoBlock] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);

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

  const infoBlockData = useMemo(() => {
    const content = page.content ?? '';
    const encoder =
      typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
    const sizeBytes = encoder ? encoder.encode(content).length : content.length;
    const sizeKb = sizeBytes / 1024;
    const lineCount = content.split(/\r?\n/).length;
    const pathLabel =
      typeof window !== 'undefined' && window.location?.pathname
        ? window.location.pathname
        : '/';

    return [
      { label: 'Type', value: 'TXT' },
      { label: 'Size', value: `${sizeKb.toFixed(1)} KB` },
      { label: 'Lines', value: `${lineCount}` },
      { label: 'Loc', value: pathLabel },
      { label: 'Status', value: 'Read-only' },
    ];
  }, [page.content]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const contentEl = contentRef.current;
    const preEl = preRef.current;

    if (!contentEl || !preEl) {
      return undefined;
    }

    const canvas = document.createElement('canvas');
    let context: CanvasRenderingContext2D | null = null;

    try {
      context = canvas.getContext('2d');
    } catch {
      context = null;
    }
    if (!context) {
      return undefined;
    }

    let frameId: number | null = null;

    const measure = () => {
      const containerWidth = contentEl.clientWidth;
      if (containerWidth <= 0) {
        return;
      }

      if (containerWidth < 640) {
        setShowInfoBlock(false);
        return;
      }

      const font = window.getComputedStyle(preEl).font;
      context.font = font;

      const lines = (page.content ?? '').split(/\r?\n/);
      let maxLineWidth = 0;

      for (const line of lines) {
        const width = context.measureText(line).width;
        if (width > maxLineWidth) {
          maxLineWidth = width;
        }
        if (maxLineWidth / containerWidth >= 0.8) {
          break;
        }
      }

      const ratio = maxLineWidth / containerWidth;
      if (ratio >= 0.8) {
        setShowInfoBlock(false);
        return;
      }
      if (ratio <= 0.3) {
        setShowInfoBlock(true);
        return;
      }

      setShowInfoBlock(false);
    };

    const scheduleMeasure = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(measure);
    };

    scheduleMeasure();

    const resizeObserver =
      'ResizeObserver' in window ? new ResizeObserver(scheduleMeasure) : null;

    resizeObserver?.observe(contentEl);
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [page.content]);

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
          href="mailto:contact@H4KU.com"
        >
          Email contact@H4KU.com
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
          ref={contentRef}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.15,
            duration: 0.3,
            ease: DEFAULT_EASE,
          }}
        >
          {showInfoBlock && (
            <aside className={styles['info-block']} aria-label="File info">
              <div className={styles['info-block-title']}>File info</div>
              <dl className={styles['info-block-list']}>
                {infoBlockData.map(item => (
                  <div key={item.label} className={styles['info-block-item']}>
                    <dt className={styles['info-block-term']}>{item.label}</dt>
                    <dd className={styles['info-block-value']}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          )}
          <pre ref={preRef}>{renderContent(page.content)}</pre>
          <div className={styles['txt-content-extra']}>
            {page.id === 'contact' && (
              <ErrorBoundary
                key={contactRetryKey}
                fallback={contactFormFallback}
              >
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
        </m.div>
      </div>
    </m.div>
  );
};
