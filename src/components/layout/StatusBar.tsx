import React, { useMemo } from 'react';
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

  return (
    <div className={styles['status-bar']}>
      <div
        className={`${styles['status-section']} ${styles['status-section--socials']}`}
      >
        <div className={styles['status-socials']}>
          {socials.map(social => {
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

            const ariaLabelParts = [`Open ${social.name}`];
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
          })}
        </div>
      </div>
      <div
        className={`${styles['status-section']} ${styles['status-section--sort']}`}
      >
        <button
          onClick={toggleSortOrder}
          className={styles['sort-button']}
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
          onClick={toggleTypeOrder}
          className={styles['sort-button']}
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
