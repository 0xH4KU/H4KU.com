import React, { useMemo } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSortOrder } from '@/contexts/SortContext';
import { mockData } from '@/data/mockData';
import styles from './StatusBar.module.css';

const StatusBar: React.FC = () => {
  const { currentView } = useNavigation();
  const { sortOrder, toggleSortOrder } = useSortOrder();
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
      <div className={styles['status-socials']}>
        {socials.map(social => (
          <a
            key={social.code}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            [{social.code}]
          </a>
        ))}
      </div>
      <span>|</span>
      <button
        onClick={toggleSortOrder}
        className={styles['sort-button']}
        title={`当前排序: ${sortOrder === 'desc' ? '新→旧 (Z-A)' : '旧→新 (A-Z)'}`}
      >
        [{sortOrder === 'desc' ? 'Z-A ↓' : 'A-Z ↑'}]
      </button>
      <span>|</span>
      <span>{itemCount} items</span>
      <span>|</span>
      <span className={styles['status-hint']}>
        Press ESC to toggle crosshair
      </span>
      <span
        className={styles['status-right']}
        aria-label={`© ${currentYear} lum.bio`}
      >
        <span className={styles['copyright-symbol']}>©</span>
        <span>{currentYear} lum.bio</span>
      </span>
    </div>
  );
};

export default StatusBar;
