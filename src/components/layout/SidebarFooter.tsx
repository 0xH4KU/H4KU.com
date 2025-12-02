import React from 'react';
import { Social } from '@/types';
import { getSafeUrl } from '@/utils/urlHelpers';
import styles from './Sidebar.module.css';

interface SidebarFooterProps {
  socials: Social[];
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ socials }) => {
  return (
    <div className={styles['sidebar-footer']}>
      {socials.map(social => {
        const safeUrl = getSafeUrl(social.url);

        if (!safeUrl) {
          return (
            <button
              key={social.code}
              type="button"
              className={`${styles['social-link']} ${styles['social-link--disabled']}`}
              disabled
              aria-disabled="true"
              aria-label={`${social.name} unavailable`}
            >
              {social.code}
            </button>
          );
        }

        const ariaLabelParts = [`${social.code}, Open ${social.name}`];
        if (safeUrl.isMailto) {
          ariaLabelParts.push('(opens email client)');
        }
        if (safeUrl.isExternal) {
          ariaLabelParts.push('(opens in new tab)');
        }

        return (
          <a
            key={social.code}
            href={safeUrl.href}
            className={styles['social-link']}
            target={safeUrl.isExternal ? '_blank' : undefined}
            rel={safeUrl.isExternal ? 'noopener noreferrer' : undefined}
            aria-label={ariaLabelParts.join(' ')}
          >
            {social.code}
          </a>
        );
      })}
    </div>
  );
};
