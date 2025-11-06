import React from 'react';
import folderIcon from '@/assets/folder.gif';
import paperIcon from '@/assets/paper.gif';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { mockData } from '@/data/mockData';
import { Folder, Page, WorkItem } from '@/types';
import styles from './ContentView.module.css';

type NavigableItem = Folder | Page;

const ContentView: React.FC = () => {
  const { currentView, navigateTo, openLightbox, resetToHome } =
    useNavigation();
  const { theme } = useTheme();

  const handleNavigate = (item: NavigableItem) => {
    navigateTo(item);
  };

  const handleOpenLightbox = (item: WorkItem) => {
    openLightbox(item);
  };

  const handleCloseTextView = () => {
    resetToHome();
  };

  if (currentView?.type === 'txt') {
    return (
      <div className={`${styles['txt-viewer']} ${theme}`}>
        <div className={styles['txt-header']}>
          <img
            className={styles['txt-icon']}
            src={paperIcon}
            alt="Text file icon"
          />
          <span>{currentView.data.name}</span>
          <button onClick={handleCloseTextView} className={styles['close-btn']}>
            ×
          </button>
        </div>
        <div className={styles['txt-content']}>
          <pre>{currentView.data.content}</pre>
        </div>
      </div>
    );
  }

  if (currentView?.type === 'folder') {
    const { items = [], children = [] } = currentView.data;

    if (!items.length && !children.length) {
      return (
        <div className={styles['folder-empty']}>
          No items in this folder yet.
        </div>
      );
    }

    return (
      <div className={styles['folder-content']}>
        {children.length > 0 && (
          <div className={styles['file-grid']}>
            {children.map(child => (
              <div
                key={child.id}
                className={styles['file-item']}
                onClick={() => handleNavigate(child)}
              >
                <img
                  className={styles['file-icon']}
                  src={folderIcon}
                  alt="Folder icon"
                />
                <div className={styles['file-name']}>{child.name}</div>
              </div>
            ))}
          </div>
        )}
        {items.length > 0 && (
          <div className={styles['works-grid']}>
            {items.map(item => (
              <div
                key={item.id}
                className={styles['work-item']}
                onClick={() => handleOpenLightbox(item)}
              >
                <img src={item.thumb} alt={item.filename} />
                <div className={styles['work-info']}>{item.filename}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles['file-grid']}>
      {mockData.folders.map(folder => (
        <div
          key={folder.id}
          className={styles['file-item']}
          onClick={() => handleNavigate(folder)}
        >
          <img
            className={styles['file-icon']}
            src={folderIcon}
            alt="Folder icon"
          />
          <div className={styles['file-name']}>{folder.name}</div>
        </div>
      ))}
      {mockData.pages.map(page => (
        <div
          key={page.id}
          className={styles['file-item']}
          onClick={() => handleNavigate(page)}
        >
          <img
            className={styles['file-icon']}
            src={paperIcon}
            alt="Text file icon"
          />
          <div className={styles['file-name']}>{page.name}</div>
        </div>
      ))}
    </div>
  );
};

export default ContentView;
