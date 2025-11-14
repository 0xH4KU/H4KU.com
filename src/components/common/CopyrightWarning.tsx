/**
 * Copyright Warning Component
 *
 * Displays a prominent warning overlay when the application is detected
 * running on an unauthorized domain. Serves as a visible deterrent against
 * unauthorized deployment and redistribution.
 */

import { AlertTriangle, ExternalLink, Shield } from 'lucide-react';
import { useEffect } from 'react';
import styles from './CopyrightWarning.module.css';

interface CopyrightWarningProps {
  currentDomain: string;
  authorizedDomains?: string[];
}

export const CopyrightWarning: React.FC<CopyrightWarningProps> = ({
  currentDomain,
  authorizedDomains = [],
}) => {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body?.classList.add('domain-locked');
      return () => document.body?.classList.remove('domain-locked');
    }
    return undefined;
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <AlertTriangle size={48} className={styles.icon} />
          <h1>Unauthorized Deployment Detected</h1>
        </div>

        <div className={styles.content}>
          <div className={styles.alert}>
            <p>
              <strong>
                This website is being served from an unauthorized domain:
              </strong>
            </p>
            <code className={styles.domain}>{currentDomain}</code>
          </div>

          <div className={styles.section}>
            <h2>⚖️ Legal Notice</h2>
            <p>
              This website and its source code are protected under the{' '}
              <strong>Limited Personal Source License (LPSL-1.0)</strong>.
            </p>
            <ul>
              <li>
                Unauthorized deployment is <strong>strictly prohibited</strong>
              </li>
              <li>
                Redistribution and commercial use are{' '}
                <strong>not permitted</strong>
              </li>
              <li>This deployment violates copyright law</li>
              <li>Legal action may be pursued against violators</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2>✅ Authorized Domains</h2>
            <p>This application is only licensed to run on:</p>
            <ul className={styles.authorizedList}>
              {authorizedDomains.map(domain => (
                <li key={domain}>
                  <code>{domain}</code>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h2>📄 License Information</h2>
            <p>
              For licensing inquiries or to report this unauthorized deployment,
              please visit the official repository.
            </p>
            <a
              href="https://github.com/cervantes/lum.bio"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              View License <ExternalLink size={16} />
            </a>
          </div>
        </div>

        <div className={styles.footer}>
          <Shield size={18} />
          <p>
            This build is locked on unauthorized domains. All access attempts
            are logged for forensic purposes.
          </p>
        </div>
      </div>
    </div>
  );
};
