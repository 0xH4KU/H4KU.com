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
        {socials.map(social => (
          <a
            key={social.code}
            href={social.url}
            className={styles['social-link']}
            target="_blank"
            rel="noopener noreferrer"
          >
            {social.code}
          </a>
        ))}
      </div>

      <div className={styles['resize-handle']} onMouseDown={handleDragStart} />
    </div>
  );
};

export default Sidebar;
