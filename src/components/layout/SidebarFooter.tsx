import React from 'react';
import { Mail } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { Social } from '@/types';
import { getSafeUrl } from '@/utils/urlHelpers';
import styles from './Sidebar.module.css';

interface SidebarFooterProps {
  socials: Social[];
}

// Social platform icons as inline SVGs (16x16 viewBox)
const SocialIcons: Record<string, React.ReactNode> = {
  // Bluesky butterfly icon
  BS: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
    </svg>
  ),
  // Instagram camera icon
  IG: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  // Twitter/X icon (Classic Bird)
  TW: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
    </svg>
  ),
  // Newgrounds tank icon
  NG: (
    <svg viewBox="0 0 90 90" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M31.81 8a9.088 9.088 0 0 1 9.088 9.088v62.125A3.787 3.787 0 0 1 37.11 83h-8.33a3.787 3.787 0 0 1-3.787-3.787V27.537a3.787 3.787 0 0 0-3.787-3.787h-1.515a3.787 3.787 0 0 0-3.786 3.787v51.676A3.787 3.787 0 0 1 12.118 83H3.787A3.787 3.787 0 0 1 0 79.213V11.787A3.787 3.787 0 0 1 3.787 8h28.022Zm49.102 0A9.088 9.088 0 0 1 90 17.088v15.633a3.03 3.03 0 0 1-3.03 3.029H76.368a3.03 3.03 0 0 1-3.029-3.03v-6.698a2.272 2.272 0 0 0-2.272-2.272H67.28a2.272 2.272 0 0 0-2.272 2.272v38.963c0 .837.678 1.515 1.515 1.515h6.059c.836 0 1.514-.678 1.514-1.515V57.5h-1.514a3.03 3.03 0 0 1-3.03-3.03v-9.69a3.03 3.03 0 0 1 3.03-3.03h14.39A3.03 3.03 0 0 1 90 44.78v29.132A9.088 9.088 0 0 1 80.912 83H58.19a9.088 9.088 0 0 1-9.089-9.088V17.088A9.088 9.088 0 0 1 58.191 8h22.72Z"
      />
    </svg>
  ),
};

const SOCIAL_ORDER = ['EM', 'IG', 'NG', 'BS', 'TW'];

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ socials }) => {
  const sortedSocials = [...socials].sort((a, b) => {
    const indexA = SOCIAL_ORDER.indexOf(a.code);
    const indexB = SOCIAL_ORDER.indexOf(b.code);
    // If not found in order list, put at the end
    const safeIndexA = indexA === -1 ? 999 : indexA;
    const safeIndexB = indexB === -1 ? 999 : indexB;
    return safeIndexA - safeIndexB;
  });

  return (
    <div className={styles['sidebar-footer']}>
      {sortedSocials.map(social => {
        const safeUrl = getSafeUrl(social.url);
        const isEmail = social.code === 'EM';
        const icon = isEmail ? <Mail size={18} aria-hidden="true" /> : SocialIcons[social.code];

        if (!safeUrl) {
          return (
            <Tooltip key={social.code} content={`${social.name} (Unavailable)`}>
              <button
                type="button"
                className={`${styles['social-icon']} ${styles['social-icon--disabled']}`}
                disabled
                aria-disabled="true"
                aria-label={`${social.name} unavailable`}
              >
                {icon || social.code[0]}
              </button>
            </Tooltip>
          );
        }

        return (
          <Tooltip key={social.code} content={social.name}>
            <a
              href={safeUrl.href}
              className={styles['social-icon']}
              target={safeUrl.isExternal ? '_blank' : undefined}
              rel={safeUrl.isExternal ? 'noopener noreferrer' : undefined}
              aria-label={social.name}
            >
              {icon || social.code[0]}
            </a>
          </Tooltip>
        );
      })}
    </div>
  );
};
