import React, { useMemo } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { mockData } from '@/data/mockData';
import styles from './StatusBar.module.css';

const StatusBar: React.FC = () => {
  const { currentView } = useNavigation();
  const { socials } = mockData;

  const itemCount = useMemo(() => {
    if (!currentView) {
      return mockData.folders.length + mockData.pages.length;
    }

    if (currentView.type === 'folder') {
      const { items = [], children = [] } = currentView.data;
      return items.length + children.length;
    }

    return 0;
  }, [currentView]);

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
      <span>{itemCount} items</span>
      <span>|</span>
      <span style={{ fontSize: 'var(--font-size-xxs)', opacity: 0.6 }}>
        Press ESC to toggle crosshair
      </span>
      <span style={{ marginLeft: 'auto' }}>© 2025 lum.bio</span>
    </div>
  );
};

export default StatusBar;
