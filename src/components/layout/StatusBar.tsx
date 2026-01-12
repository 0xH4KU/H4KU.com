import React, { useMemo, useCallback } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSortOrder } from '@/contexts/SortContext';
import { mockData, dataIntegrity } from '@/data/mockData';
import { getSafeUrl } from '@/utils/urlHelpers';
import styles from './StatusBar.module.css';

// Check commission status from About page content
function getCommissionStatus(): { available: boolean; text: string } {
  const aboutPage = mockData.pages.find(p => p.id === 'about');
  const content = aboutPage?.content?.toLowerCase() ?? '';
  if (content.includes('not available for commissions')) {
    return { available: false, text: 'Not accepting commissions' };
  }
  if (content.includes('available for commissions')) {
    return { available: true, text: 'Open for commissions' };
  }
  return { available: false, text: 'Commission status unknown' };
}

const StatusBar: React.FC = () => {
  const { currentView, navigateTo } = useNavigation();
  const { sortOrder, toggleSortOrder, typeOrder, toggleTypeOrder } =
    useSortOrder();
  const { socials } = mockData;
  const commissionStatus = useMemo(() => getCommissionStatus(), []);

  const itemCount = useMemo(() => {
    if (!currentView) {
      return (
        mockData.folders.length +
        mockData.pages.length +
        mockData.homeItems.length
      );
    }

    if (currentView.type === 'folder') {
      const { items = [], children = [] } = currentView.data;
      return items.length + children.length;
    }

    return 0;
  }, [currentView]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const handleToggleSortOrder = useCallback(() => {
    toggleSortOrder();
  }, [toggleSortOrder]);

  const handleToggleTypeOrder = useCallback(() => {
    toggleTypeOrder();
  }, [toggleTypeOrder]);

  const handleLicenseClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const licensePage = mockData.pages.find(p => p.id === 'license');
      if (licensePage) {
        navigateTo(licensePage);
      }
    },
    [navigateTo]
  );

  // Get individual social links in order: EM, BS, TW
  const getSocialLink = useCallback(
    (code: string) => {
      const social = socials.find(s => s.code === code);
      if (!social) return null;

      const safeUrl = getSafeUrl(social.url);
      if (!safeUrl) {
        return (
          <span
            className={styles['status-social-disabled']}
            aria-disabled="true"
          >
            [{social.code}]
          </span>
        );
      }

      const ariaLabelParts = [`[${social.code}], Open ${social.name}`];
      if (safeUrl.isMailto) ariaLabelParts.push('(opens email client)');
      if (safeUrl.isExternal) ariaLabelParts.push('(opens in new tab)');

      return (
        <a
          href={safeUrl.href}
          target={safeUrl.isExternal ? '_blank' : undefined}
          rel={safeUrl.isExternal ? 'noopener noreferrer' : undefined}
          aria-label={ariaLabelParts.join(' ')}
          className={styles['social-link']}
        >
          [{social.code}]
        </a>
      );
    },
    [socials]
  );

  const integrityAlgorithmLabel =
    dataIntegrity.algorithm === 'sha256' ? 'SHA-256' : 'FNV-1a';

  const integrityTitle = dataIntegrity.isValid
    ? `Content integrity verified (${integrityAlgorithmLabel}: ${dataIntegrity.actual})`
    : `${integrityAlgorithmLabel} mismatch (expected ${
        dataIntegrity.expected ?? 'unknown'
      }, actual ${dataIntegrity.actual})`;

  const integrityLabel = dataIntegrity.isValid
    ? '[verified]'
    : '[tamper detected]';

  const mismatchSummary = !dataIntegrity.isValid
    ? dataIntegrity.details
      ? `FNV-1a expected ${
          dataIntegrity.details.fnv1a.expected ?? 'missing'
        } vs ${dataIntegrity.details.fnv1a.actual} | SHA-256 expected ${
          dataIntegrity.details.sha256.expected ?? 'missing'
        } vs ${dataIntegrity.details.sha256.actual}`
      : `Expected ${dataIntegrity.expected ?? 'missing'} vs ${
          dataIntegrity.actual
        }`
    : '';

  return (
    <div className={styles['status-bar']}>
      {/* Commission Status - Priority 1 */}
      <div
        className={`${styles['status-section']} ${styles['status-section--commission']}`}
      >
        <span
          className={`${styles['commission-status']} ${
            commissionStatus.available
              ? styles['commission-status--open']
              : styles['commission-status--closed']
          }`}
          role="status"
        >
          <span className={styles['commission-dot']} aria-hidden="true" />
          <span className={styles['commission-label']}>
            {commissionStatus.available ? 'OPEN' : 'CLOSED'}
          </span>
        </span>
      </div>

      {/* Social: EM - Priority 4 */}
      <div
        className={`${styles['status-section']} ${styles['status-section--social-em']}`}
      >
        {getSocialLink('EM')}
      </div>

      {/* Social: BS - Priority 5 */}
      <div
        className={`${styles['status-section']} ${styles['status-section--social-bs']}`}
      >
        {getSocialLink('BS')}
      </div>

      {/* Social: TW - Priority 6 */}
      <div
        className={`${styles['status-section']} ${styles['status-section--social-tw']}`}
      >
        {getSocialLink('TW')}
      </div>

      {/* Sort Order - Priority 7 */}
      <div
        className={`${styles['status-section']} ${styles['status-section--sort']}`}
      >
        <button
          onClick={handleToggleSortOrder}
          className={styles['sort-button']}
          aria-label={
            sortOrder === 'desc'
              ? 'Toggle sort order. Current: A to Z, 9 to 0'
              : 'Toggle sort order. Current: Z to A, 0 to 9'
          }
          title={
            sortOrder === 'desc'
              ? 'Default sort: text A-Z, numbers 9-0'
              : 'Reversed sort: text Z-A, numbers 0-9'
          }
        >
          {sortOrder === 'desc' ? 'A-Z|9-0' : 'Z-A|0-9'}
        </button>
      </div>

      {/* Type Order - Priority 7 */}
      <div
        className={`${styles['status-section']} ${styles['status-section--type']}`}
      >
        <button
          onClick={handleToggleTypeOrder}
          className={styles['sort-button']}
          aria-label={
            typeOrder === 'folders-first'
              ? 'Toggle type order. Current: Folders, Pages, Images'
              : 'Toggle type order. Current: Images, Pages, Folders'
          }
          title={
            typeOrder === 'folders-first'
              ? 'Type order: Folder > Page > Image'
              : 'Type order: Image > Page > Folder'
          }
        >
          {typeOrder === 'folders-first' ? 'F>P>Img' : 'Img>P>F'}
        </button>
      </div>

      {/* Item Count - Priority 8 */}
      <div
        className={`${styles['status-section']} ${styles['status-section--count']}`}
      >
        <span>{itemCount} items</span>
      </div>

      {/* Hint - Priority 9 (hide first) */}
      <div
        className={`${styles['status-section']} ${styles['status-section--hint']}`}
      >
        <span className={styles['status-hint']}>
          Press ESC to toggle crosshair
        </span>
      </div>

      {/* Integrity - Priority 2 */}
      <div
        className={`${styles['status-section']} ${styles['status-section--integrity']}`}
      >
        <span
          className={`${styles['integrity-indicator']} ${
            dataIntegrity.isValid
              ? styles['integrity-indicator--valid']
              : styles['integrity-indicator--invalid']
          }`}
          role="status"
          aria-live={dataIntegrity.isValid ? 'polite' : 'assertive'}
          title={integrityTitle}
        >
          {integrityLabel}
        </span>
        {!dataIntegrity.isValid && (
          <span className={styles['integrity-warning']} role="alert">
            Integrity mismatch detected. {mismatchSummary} Run{' '}
            <code>npm run integrity:check</code> to verify.
          </span>
        )}
      </div>

      {/* License - Priority 3 */}
      <div
        className={`${styles['status-section']} ${styles['status-section--license']}`}
      >
        <a
          href="/page/license"
          onClick={handleLicenseClick}
          className={styles['license-link']}
          aria-label="View license information (HPSL-1.0)"
          title="HAKU Personal Source License - Click to view terms"
        >
          HPSL-1.0
        </a>
      </div>

      {/* Meta - Priority 1 */}
      <div
        className={`${styles['status-section']} ${styles['status-section--meta']}`}
      >
        <span
          className={styles['status-right']}
          aria-label={`© ${currentYear} H4KU.COM`}
        >
          <span className={styles['copyright-symbol']}>©</span>
          <span>{currentYear} H4KU.COM</span>
        </span>
      </div>
    </div>
  );
};

export default StatusBar;
