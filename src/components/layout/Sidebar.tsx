import React from 'react';
import folderIcon from '@/assets/folder.gif';
import paperIcon from '@/assets/paper.gif';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSidebar } from '@/hooks/useSidebar';
import { mockData } from '@/data/mockData';
import { Folder, Page } from '@/types';
import styles from './Sidebar.module.css';

type SidebarEntry = Folder | Page;

const Sidebar: React.FC = () => {
  const collapsed = false; // Can be moved to Context if needed
  const { activePath, navigateTo } = useNavigation();
  const { sidebarWidth, startDrag } = useSidebar();
  const { folders, pages, socials } = mockData;

  const handleNavigate = (item: SidebarEntry) => {
    navigateTo(item);
  };

  const handleDragStart = () => {
    startDrag();
  };

  return (
    <div
      className={styles.sidebar}
      style={{ width: collapsed ? 0 : sidebarWidth }}
    >
      <div className={styles['sidebar-header']}>LUM.BIO</div>

      <div className={styles['sidebar-content']}>
        <div className={styles['sidebar-section']}>
          {folders.map(folder => (
            <div
              key={folder.id}
              className={`${styles['sidebar-item']}${activePath.includes(folder.id) ? ` ${styles['sidebar-item--active']}` : ''}`}
              onClick={() => handleNavigate(folder)}
            >
              <img
                className={styles['sidebar-icon']}
                src={folderIcon}
                alt="Folder icon"
              />
              <span>{folder.name}</span>
            </div>
          ))}
        </div>

        <div className={styles['sidebar-section']}>
          {pages.map(page => (
            <div
              key={page.id}
              className={`${styles['sidebar-item']}${activePath.includes(page.id) ? ` ${styles['sidebar-item--active']}` : ''}`}
              onClick={() => handleNavigate(page)}
            >
              <img
                className={styles['sidebar-icon']}
                src={paperIcon}
                alt="Text file icon"
              />
              <span>{page.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles['sidebar-footer']}>
        {socials.map(social => {
          const rawUrl = social.url ?? '';
          const url = rawUrl.trim();
          const isPlaceholder = url.length === 0 || url === '#';
          const isExternal = /^https?:\/\//i.test(url);

          if (isPlaceholder) {
            return (
              <button
                key={social.code}
                type="button"
                className={`${styles['social-link']} ${styles['social-link--disabled']}`}
                disabled
                aria-disabled="true"
                aria-label={`${social.name} coming soon`}
              >
                {social.code}
              </button>
            );
          }

          const isMailto = url.startsWith('mailto:');
          const ariaLabelParts = [`Open ${social.name}`];
          if (isMailto) {
            ariaLabelParts.push('(opens email client)');
          }
          if (isExternal) {
            ariaLabelParts.push('(opens in new tab)');
          }

          return (
            <a
              key={social.code}
              href={url}
              className={styles['social-link']}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              aria-label={ariaLabelParts.join(' ')}
            >
              {social.code}
            </a>
          );
        })}
      </div>

      <div className={styles['resize-handle']} onMouseDown={handleDragStart} />
    </div>
  );
};

export default Sidebar;
