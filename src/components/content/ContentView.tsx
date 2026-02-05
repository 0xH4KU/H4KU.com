import React, { lazy, Suspense } from 'react';
import folderIcon from '@/assets/folder.gif';
import paperIcon from '@/assets/paper.gif';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSortOrder } from '@/contexts/SortContext';
import { useLightbox } from '@/contexts/LightboxContext';
import { mockData } from '@/data/mockData';
import { Folder, Page, WorkItem } from '@/types';
import { LazyImage } from '@/components/common/LazyImage';
import { IMAGE_CONFIG } from '@/config/constants';
import {
  getFolderLabel,
  getPageLabel,
  getWorkItemLabel,
  sortByLabel,
} from '@/utils/sortHelpers';
import { isPageItem, filterWorkImages } from '@/utils/workItems';
const TextView = lazy(() =>
  import('./TextView').then(module => ({ default: module.TextView }))
);
const FolderView = lazy(() =>
  import('./FolderView').then(module => ({ default: module.FolderView }))
);
import styles from './ContentView.module.css';

type NavigableItem = Folder | Page;

const ContentView: React.FC = () => {
  const { currentView, currentPath, navigateTo, navigateBack } =
    useNavigation();
  const { openLightbox } = useLightbox();
  const { sortOrder, typeOrder } = useSortOrder();

  const handleNavigate = (item: NavigableItem) => {
    navigateTo(item);
  };

  const handleOpenLightbox = (item: WorkItem, gallery: WorkItem[]) => {
    openLightbox(item, gallery);
  };

  const handleCloseTextView = () => {
    navigateBack();
  };

  // Render content depending on the active view
  const renderContent = () => {
    if (currentView?.type === 'txt') {
      return (
        <Suspense
          fallback={
            <div className={styles['folder-empty']}>Loading document…</div>
          }
        >
          <TextView page={currentView.data} onClose={handleCloseTextView} />
        </Suspense>
      );
    }

    if (currentView?.type === 'folder') {
      return (
        <Suspense
          fallback={
            <div className={styles['folder-empty']}>Loading folder…</div>
          }
        >
          <FolderView
            folder={currentView.data}
            sortOrder={sortOrder}
            typeOrder={typeOrder}
            onNavigate={handleNavigate}
            onNavigatePageInCurrentFolder={page =>
              navigateTo(page, currentPath)
            }
            onOpenLightbox={handleOpenLightbox}
          />
        </Suspense>
      );
    }

    // Home view
    const sortedFolders = sortByLabel(
      mockData.folders,
      sortOrder,
      getFolderLabel
    );
    const visiblePages = mockData.pages.filter(page => !page.hidden);
    const sortedPages = sortByLabel(visiblePages, sortOrder, getPageLabel);
    const sortedHomeItems = sortByLabel(
      mockData.homeItems,
      sortOrder,
      getWorkItemLabel
    );
    const sortedHomeWorkItems = filterWorkImages(sortedHomeItems);
    const prioritizedHomeImageIds = new Set(
      filterWorkImages(sortedHomeItems)
        .slice(0, IMAGE_CONFIG.PRIORITY_COUNT)
        .map(item => item.id)
    );
    const homeFileBucketSequence =
      typeOrder === 'folders-first'
        ? (['folders', 'pages'] as const)
        : (['pages', 'folders'] as const);

    const renderHomeWorksGrid = () => {
      return (
        <div className={styles['works-grid']}>
          {sortedHomeItems.map(item => {
            const isTextPage = isPageItem(item);
            const shouldPrioritize =
              !isTextPage && prioritizedHomeImageIds.has(item.id);
            const handleClick = isTextPage
              ? () => {
                  const page: Page = {
                    id: item.id,
                    name: item.filename,
                    type: 'txt',
                    content: 'content' in item ? item.content : '',
                  };
                  navigateTo(page);
                }
              : () => handleOpenLightbox(item, sortedHomeWorkItems);

            return (
              <button
                key={item.id}
                className={styles['work-item']}
                type="button"
                onClick={handleClick}
              >
                {isTextPage ? (
                  <img
                    className={styles['file-icon']}
                    src={paperIcon}
                    alt="Text file icon"
                  />
                ) : (
                  <LazyImage
                    className={styles['work-thumb'] ?? ''}
                    src={'thumb' in item ? item.thumb : ''}
                    alt={item.filename}
                    {...(item.itemType === 'work' && item.sources
                      ? { sources: item.sources }
                      : {})}
                    sizes={IMAGE_CONFIG.GRID_SIZES}
                    priority={shouldPrioritize}
                    fetchPriority={shouldPrioritize ? 'high' : 'auto'}
                  />
                )}
                <div className={styles['work-info']}>{item.filename}</div>
              </button>
            );
          })}
        </div>
      );
    };

    return (
      <div className={styles['folder-content']} key="home">
        {typeOrder === 'images-first' &&
          sortedHomeItems.length > 0 &&
          renderHomeWorksGrid()}
        <div className={styles['file-grid']}>
          {homeFileBucketSequence.flatMap(bucket =>
            bucket === 'folders'
              ? sortedFolders.map(folder => (
                  <button
                    key={folder.id}
                    className={styles['file-item']}
                    type="button"
                    onClick={() => handleNavigate(folder)}
                  >
                    <img
                      className={styles['file-icon']}
                      src={folderIcon}
                      alt="Folder icon"
                    />
                    <div className={styles['file-name']}>{folder.name}</div>
                  </button>
                ))
              : sortedPages.map(page => (
                  <button
                    key={page.id}
                    className={styles['file-item']}
                    type="button"
                    onClick={() => handleNavigate(page)}
                  >
                    <img
                      className={styles['file-icon']}
                      src={paperIcon}
                      alt="Text file icon"
                    />
                    <div className={styles['file-name']}>{page.name}</div>
                  </button>
                ))
          )}
        </div>
        {typeOrder === 'folders-first' &&
          sortedHomeItems.length > 0 &&
          renderHomeWorksGrid()}
      </div>
    );
  };

  return renderContent();
};

export default ContentView;
