import React, { useMemo, lazy, Suspense } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import folderIcon from '@/assets/folder.gif';
import paperIcon from '@/assets/paper.gif';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSortOrder } from '@/contexts/SortContext';
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
  createHeaderAnimation,
  createCloseButtonAnimation,
  DEFAULT_EASE,
} from '@/config/animations';
import {
  getFolderLabel,
  getPageLabel,
  getWorkItemLabel,
  sortByLabel,
} from '@/utils/sortHelpers';
import styles from './ContentView.module.css';

const ContactForm = lazy(() =>
  import('@/components/forms/ContactForm').then(module => ({
    default: module.ContactForm,
  }))
);

type NavigableItem = Folder | Page;
const PRIORITY_IMAGE_COUNT = 2;

const ContentView: React.FC = () => {
  const { currentView, currentPath, navigateTo, openLightbox, navigateBack } =
    useNavigation();
  const { theme } = useTheme();
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

  const headerAnimation = useMemo(
    () => createHeaderAnimation(prefersReducedMotion, DEFAULT_EASE),
    [prefersReducedMotion]
  );

  const closeButtonAnimation = useMemo(
    () => createCloseButtonAnimation(prefersReducedMotion),
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

  // 渲染內容的函數
  const renderContent = () => {
    if (currentView?.type === 'txt') {
      return (
        <m.div
          className={`${styles['txt-viewer']} ${theme}`}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          key={`txt-${currentView.data.id}`}
        >
          <m.div
            className={styles['txt-header']}
            initial={headerAnimation.initial}
            animate={headerAnimation.animate}
            transition={headerAnimation.transition}
          >
            <img
              className={styles['txt-icon']}
              src={paperIcon}
              alt="Text file icon"
            />
            <span>{currentView.data.name}</span>
            <m.button
              onClick={handleCloseTextView}
              className={styles['close-btn']}
              {...closeButtonAnimation}
            >
              ×
            </m.button>
          </m.div>
          <m.div
            className={styles['txt-content']}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.15,
              duration: 0.3,
              ease: DEFAULT_EASE,
            }}
          >
            <pre>{currentView.data.content}</pre>
            {currentView.data.id === 'contact' && (
              <Suspense fallback={null}>
                <ContactForm />
              </Suspense>
            )}
          </m.div>
        </m.div>
      );
    }

    if (currentView?.type === 'folder') {
      const { items = [], children = [] } = currentView.data;
      const textItems = sortByLabel(
        items.filter(item => item.itemType === 'page'),
        sortOrder,
        getWorkItemLabel
      );
      const workItems = sortByLabel(
        items.filter(item => item.itemType !== 'page'),
        sortOrder,
        getWorkItemLabel
      );
      const sortedChildren = sortByLabel(children, sortOrder, getFolderLabel);
      const bucketSequence =
        typeOrder === 'folders-first'
          ? (['folders', 'pages', 'works'] as const)
          : (['works', 'pages', 'folders'] as const);
      const hasFileGridContent =
        children.length > 0 || textItems.length > 0 || workItems.length > 0;

      if (!items.length && !children.length) {
        return (
          <m.div
            className={styles['folder-empty']}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            key={`folder-${currentView.data.id}`}
          >
            No items in this folder yet.
          </m.div>
        );
      }

      return (
        <m.div
          className={styles['folder-content']}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          key={`folder-${currentView.data.id}`}
        >
          {hasFileGridContent && (
            <m.div
              className={styles['file-grid']}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {bucketSequence.flatMap(bucket => {
                if (bucket === 'folders') {
                  return sortedChildren.map(child => (
                    <m.div
                      key={child.id}
                      className={styles['file-item']}
                      variants={itemVariants}
                      onClick={() => handleNavigate(child)}
                      whileHover={createHoverAnimation(prefersReducedMotion)}
                      whileTap={createTapAnimation(prefersReducedMotion)}
                    >
                      <img
                        className={styles['file-icon']}
                        src={folderIcon}
                        alt="Folder icon"
                      />
                      <div className={styles['file-name']}>{child.name}</div>
                    </m.div>
                  ));
                }
                if (bucket === 'pages') {
                  return textItems.map(item => (
                    <m.div
                      key={item.id}
                      className={styles['file-item']}
                      variants={itemVariants}
                      onClick={() => {
                        const page: Page = {
                          id: item.id,
                          name: item.filename,
                          type: 'txt',
                          content: 'content' in item ? item.content : '',
                        };
                        navigateTo(page, currentPath);
                      }}
                      whileHover={createHoverAnimation(prefersReducedMotion)}
                      whileTap={createTapAnimation(prefersReducedMotion)}
                    >
                      <img
                        className={styles['file-icon']}
                        src={paperIcon}
                        alt="Text file icon"
                      />
                      <div className={styles['file-name']}>{item.filename}</div>
                    </m.div>
                  ));
                }
                return workItems.map((item, workIndex) => {
                  const shouldPrioritize = workIndex < PRIORITY_IMAGE_COUNT;
                  return (
                    <m.div
                      key={item.id}
                      className={styles['file-item']}
                      variants={itemVariants}
                      onClick={() => handleOpenLightbox(item, workItems)}
                      whileHover={createHoverAnimation(prefersReducedMotion)}
                      whileTap={createTapAnimation(prefersReducedMotion)}
                    >
                      <LazyImage
                        className={styles['file-thumb']}
                        src={'thumb' in item ? item.thumb : ''}
                        alt={item.filename}
                        sizes={IMAGE_CONFIG.GRID_SIZES}
                        priority={shouldPrioritize}
                        fetchPriority={shouldPrioritize ? 'high' : 'auto'}
                      />
                      <div className={styles['file-name']}>{item.filename}</div>
                    </m.div>
                  );
                });
              })}
            </m.div>
          )}
        </m.div>
      );
    }

    // 主頁
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
    const sortedHomeWorkItems = sortedHomeItems.filter(
      item => item.itemType !== 'page'
    );
    const homeFileBucketSequence =
      typeOrder === 'folders-first'
        ? (['folders', 'pages'] as const)
        : (['pages', 'folders'] as const);

    const renderHomeWorksGrid = () => {
      let prioritizedHomeImages = 0;
      return (
        <m.div
          className={styles['works-grid']}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {sortedHomeItems.map(item => {
            const isTextPage = item.itemType === 'page';
            const shouldPrioritize =
              !isTextPage && prioritizedHomeImages < PRIORITY_IMAGE_COUNT;
            if (shouldPrioritize) {
              prioritizedHomeImages += 1;
            }
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
              <m.div
                key={item.id}
                className={styles['work-item']}
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
                    sizes={IMAGE_CONFIG.GRID_SIZES}
                    priority={shouldPrioritize}
                    fetchPriority={shouldPrioritize ? 'high' : 'auto'}
                  />
                )}
                <div className={styles['work-info']}>{item.filename}</div>
              </m.div>
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
                  <m.div
                    key={folder.id}
                    className={styles['file-item']}
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
                  </m.div>
                ))
              : sortedPages.map(page => (
                  <m.div
                    key={page.id}
                    className={styles['file-item']}
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
                  </m.div>
                ))
          )}
        </m.div>
        {typeOrder === 'folders-first' &&
          sortedHomeItems.length > 0 &&
          renderHomeWorksGrid()}
      </m.div>
    );
  };

  // 統一返回，包裹 AnimatePresence
  return <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>;
};

export default ContentView;
