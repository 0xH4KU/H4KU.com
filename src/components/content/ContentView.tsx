import React, { useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import folderIcon from '@/assets/folder.gif';
import paperIcon from '@/assets/paper.gif';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSortOrder } from '@/contexts/SortContext';
import { useLightbox } from '@/contexts/LightboxContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { mockData } from '@/data/mockData';
import { Folder, Page, WorkItem } from '@/types';
import { LazyImage } from '@/components/common/LazyImage';
import { IMAGE_CONFIG } from '@/config/constants';
import {
  createContainerVariants,
  createItemVariants,
  createPageVariants,
  createHoverAnimation,
  createTapAnimation,
} from '@/config/animations';
import {
  getFolderLabel,
  getPageLabel,
  getWorkItemLabel,
  sortByLabel,
} from '@/utils/sortHelpers';
import { isPageItem, filterWorkImages } from '@/utils/workItems';
import { TextView } from './TextView';
import { FolderView } from './FolderView';
import styles from './ContentView.module.css';

type NavigableItem = Folder | Page;

const ContentView: React.FC = () => {
  const { currentView, currentPath, navigateTo, navigateBack } =
    useNavigation();
  const { openLightbox } = useLightbox();
  const { sortOrder, typeOrder } = useSortOrder();
  const prefersReducedMotion = useReducedMotion();

  // Use centralized animation configurations
  const containerVariants = useMemo(
    () => createContainerVariants(prefersReducedMotion),
    [prefersReducedMotion]
  );

  const itemVariants = useMemo(
    () => createItemVariants(prefersReducedMotion),
    [prefersReducedMotion]
  );

  const pageVariants = useMemo(
    () => createPageVariants(prefersReducedMotion),
    [prefersReducedMotion]
  );

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
      return <TextView page={currentView.data} onClose={handleCloseTextView} />;
    }

    if (currentView?.type === 'folder') {
      return (
        <FolderView
          folder={currentView.data}
          sortOrder={sortOrder}
          typeOrder={typeOrder}
          containerVariants={containerVariants}
          itemVariants={itemVariants}
          pageVariants={pageVariants}
          prefersReducedMotion={prefersReducedMotion}
          onNavigate={handleNavigate}
          onNavigatePageInCurrentFolder={page => navigateTo(page, currentPath)}
          onOpenLightbox={handleOpenLightbox}
        />
      );
    }

    // Home view
    const sortedFolders = sortByLabel(
      mockData.folders,
      sortOrder,
      getFolderLabel
    );
    const sortedPages = sortByLabel(mockData.pages, sortOrder, getPageLabel);
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
        <m.div
          className={styles['works-grid']}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
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
              <m.button
                key={item.id}
                className={styles['work-item']}
                type="button"
                variants={itemVariants}
                onClick={handleClick}
                whileHover={createHoverAnimation(prefersReducedMotion)}
                whileTap={createTapAnimation(prefersReducedMotion)}
              >
                {isTextPage ? (
                  <img
                    className={styles['file-icon']}
                    src={paperIcon}
                    alt="Text file icon"
                  />
                ) : (
                  <LazyImage
                    className={styles['work-thumb']}
                    src={'thumb' in item ? item.thumb : ''}
                    alt={item.filename}
                    sources={
                      item.itemType === 'work' ? item.sources : undefined
                    }
                    sizes={IMAGE_CONFIG.GRID_SIZES}
                    priority={shouldPrioritize}
                    fetchPriority={shouldPrioritize ? 'high' : 'auto'}
                  />
                )}
                <div className={styles['work-info']}>{item.filename}</div>
              </m.button>
            );
          })}
        </m.div>
      );
    };

    return (
      <m.div
        className={styles['folder-content']}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        key="home"
      >
        {typeOrder === 'images-first' &&
          sortedHomeItems.length > 0 &&
          renderHomeWorksGrid()}
        <m.div
          className={styles['file-grid']}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {homeFileBucketSequence.flatMap(bucket =>
            bucket === 'folders'
              ? sortedFolders.map(folder => (
                  <m.button
                    key={folder.id}
                    className={styles['file-item']}
                    type="button"
                    variants={itemVariants}
                    onClick={() => handleNavigate(folder)}
                    whileHover={createHoverAnimation(prefersReducedMotion)}
                    whileTap={createTapAnimation(prefersReducedMotion)}
                  >
                    <img
                      className={styles['file-icon']}
                      src={folderIcon}
                      alt="Folder icon"
                    />
                    <div className={styles['file-name']}>{folder.name}</div>
                  </m.button>
                ))
              : sortedPages.map(page => (
                  <m.button
                    key={page.id}
                    className={styles['file-item']}
                    type="button"
                    variants={itemVariants}
                    onClick={() => handleNavigate(page)}
                    whileHover={createHoverAnimation(prefersReducedMotion)}
                    whileTap={createTapAnimation(prefersReducedMotion)}
                  >
                    <img
                      className={styles['file-icon']}
                      src={paperIcon}
                      alt="Text file icon"
                    />
                    <div className={styles['file-name']}>{page.name}</div>
                  </m.button>
                ))
          )}
        </m.div>
        {typeOrder === 'folders-first' &&
          sortedHomeItems.length > 0 &&
          renderHomeWorksGrid()}
      </m.div>
    );
  };

  // Always wrap the rendered view with AnimatePresence for transitions
  return <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>;
};

export default ContentView;
