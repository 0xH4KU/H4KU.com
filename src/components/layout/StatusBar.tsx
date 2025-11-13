import React, { useMemo, useCallback } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSortOrder } from '@/contexts/SortContext';
import { mockData } from '@/data/mockData';
import { getSafeUrl } from '@/utils/urlHelpers';
import styles from './StatusBar.module.css';

const StatusBar: React.FC = () => {
  const { currentView } = useNavigation();
  const { sortOrder, toggleSortOrder, typeOrder, toggleTypeOrder } =
    useSortOrder();
  const { socials } = mockData;

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

  const socialLinks = useMemo(
    () =>
      socials.map(social => {
        const safeUrl = getSafeUrl(social.url);

        if (!safeUrl) {
          return (
            <span
              key={social.code}
              className={styles['status-social-disabled']}
              aria-disabled="true"
            >
              [{social.code}]
            </span>
          );
        }

        const ariaLabelParts = [`[${social.code}], Open ${social.name}`];
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
            target={safeUrl.isExternal ? '_blank' : undefined}
            rel={safeUrl.isExternal ? 'noopener noreferrer' : undefined}
            aria-label={ariaLabelParts.join(' ')}
          >
            [{social.code}]
          </a>
        );
      }),
    [socials]
  );

  return (
    <div className={styles['status-bar']}>
      <div
        className={`${styles['status-section']} ${styles['status-section--socials']}`}
      >
        <div className={styles['status-socials']}>{socialLinks}</div>
      </div>
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
              ? '默认排序：文字 A→Z，数字 9→0'
              : '反转排序：文字 Z→A，数字 0→9'
          }
        >
          [{sortOrder === 'desc' ? 'A→Z|9→0' : 'Z→A|0→9'}]
        </button>
      </div>
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
              ? '类型排序: Folder > Page > Image'
              : '类型排序: Image > Page > Folder'
          }
        >
          [{typeOrder === 'folders-first' ? 'F>P>Img' : 'Img>P>F'}]
        </button>
      </div>
      <div
        className={`${styles['status-section']} ${styles['status-section--count']}`}
      >
        <span>{itemCount} items</span>
      </div>
      <div
        className={`${styles['status-section']} ${styles['status-section--hint']}`}
      >
        <span className={styles['status-hint']}>
          Press ESC to toggle crosshair
        </span>
      </div>
      <div
        className={`${styles['status-section']} ${styles['status-section--meta']}`}
      >
        <span
          className={styles['status-right']}
          aria-label={`© ${currentYear} lum.bio`}
        >
          <span className={styles['copyright-symbol']}>©</span>
          <span>{currentYear} lum.bio</span>
        </span>
      </div>
    </div>
  );
};

export default StatusBar;
