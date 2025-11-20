import React, { useMemo, lazy, Suspense, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import folderIcon from '@/assets/folder.gif';
import paperIcon from '@/assets/paper.gif';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSortOrder } from '@/contexts/SortContext';
import { useLightbox } from '@/contexts/LightboxContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { mockData } from '@/data/mockData';
import { Folder, Page, WorkItem } from '@/types';
import { LazyImage } from '@/components/common/LazyImage';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
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
  const { currentView, currentPath, navigateTo, navigateBack } =
    useNavigation();
  const { openLightbox } = useLightbox();
  const { theme } = useTheme();
  const { sortOrder, typeOrder } = useSortOrder();
  const prefersReducedMotion = useReducedMotion();
  const [contactRetryKey, setContactRetryKey] = useState(0);

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

  // Render content depending on the active view
  const renderContent = () => {
    if (currentView?.type === 'txt') {
      const contactFormFallback = (
        <div className={styles['contact-error']} role="alert">
          <p>We could not load the contact form just yet.</p>
          <div className={styles['contact-error-actions']}>
            <button
              type="button"
              className={styles['contact-error-button']}
              onClick={() => setContactRetryKey(prev => prev + 1)}
            >
              Try again
            </button>
            <a
              className={styles['contact-error-link']}
              href="mailto:hi@lum.bio"
            >
              Email hi@lum.bio
            </a>
          </div>
        </div>
      );

      return (
        <m.div
          className={styles['txt-viewer-wrapper']}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          key={`txt-${currentView.data.id}`}
        >
          <div className={`${styles['txt-viewer']} ${theme}`}>
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
                width="36"
                height="36"
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
                <ErrorBoundary
                  key={contactRetryKey}
                  fallback={contactFormFallback}
                >
                  <Suspense
                    fallback={
                      <div className={styles['contact-loading']} role="status">
                        Loading secure contact form…
                      </div>
                    }
                  >
                    <ContactForm />
                  </Suspense>
                </ErrorBoundary>
              )}
            </m.div>
          </div>
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
                    <m.button
                      key={child.id}
                      className={styles['file-item']}
                      type="button"
                      variants={itemVariants}
                      onClick={() => handleNavigate(child)}
                      whileHover={createHoverAnimation(prefersReducedMotion)}
                      whileTap={createTapAnimation(prefersReducedMotion)}
                    >
                      <img
                        className={styles['file-icon']}
                        src={folderIcon}
                        alt="Folder icon"
                        width="96"
                        height="96"
                      />
                      <div className={styles['file-name']}>{child.name}</div>
                    </m.button>
                  ));
                }
                if (bucket === 'pages') {
                  return textItems.map(item => (
                    <m.button
                      key={item.id}
                      className={styles['file-item']}
                      type="button"
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
                        width="96"
                        height="96"
                      />
                      <div className={styles['file-name']}>{item.filename}</div>
                    </m.button>
                  ));
                }
                return workItems.map((item, workIndex) => {
                  const shouldPrioritize = workIndex < PRIORITY_IMAGE_COUNT;
                  return (
                    <m.button
                      key={item.id}
                      className={styles['file-item']}
                      type="button"
                      variants={itemVariants}
                      onClick={() => handleOpenLightbox(item, workItems)}
                      whileHover={createHoverAnimation(prefersReducedMotion)}
                      whileTap={createTapAnimation(prefersReducedMotion)}
                    >
                      <LazyImage
                        className={styles['file-thumb']}
                        src={'thumb' in item ? item.thumb : ''}
                        alt={item.filename}
                        sources={
                          item.itemType === 'work' ? item.sources : undefined
                        }
                        sizes={IMAGE_CONFIG.GRID_SIZES}
                        priority={shouldPrioritize}
                        fetchPriority={shouldPrioritize ? 'high' : 'auto'}
                      />
                      <div className={styles['file-name']}>{item.filename}</div>
                    </m.button>
                  );
                });
              })}
            </m.div>
          )}
        </m.div>
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
    const sortedHomeWorkItems = sortedHomeItems.filter(
      item => item.itemType !== 'page'
    );
    const prioritizedHomeImageIds = new Set(
      sortedHomeItems
        .filter(item => item.itemType !== 'page')
        .slice(0, PRIORITY_IMAGE_COUNT)
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
            const isTextPage = item.itemType === 'page';
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
