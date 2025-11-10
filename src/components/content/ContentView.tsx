import React, { useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import folderIcon from '@/assets/folder.gif';
import paperIcon from '@/assets/paper.gif';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSortOrder } from '@/contexts/SortContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { mockData } from '@/data/mockData';
import { Folder, Page, WorkItem } from '@/types';
import { LazyImage } from '@/components/common/LazyImage';
import { ContactForm } from '@/components/forms/ContactForm';
import {
  getFolderLabel,
  getPageLabel,
  getWorkItemLabel,
  sortByLabel,
} from '@/utils/sortHelpers';
import styles from './ContentView.module.css';

type NavigableItem = Folder | Page;

const ContentView: React.FC = () => {
  const { currentView, currentPath, navigateTo, openLightbox, resetToHome } =
    useNavigation();
  const { theme } = useTheme();
  const { sortOrder, typeOrder } = useSortOrder();
  const prefersReducedMotion = useReducedMotion();

  // 動畫變體配置 - 簡潔直接的動畫
  const defaultEase = useMemo<[number, number, number, number]>(
    () => [0.25, 0.1, 0.25, 1],
    []
  );

  const containerVariants = useMemo(
    () =>
      ({
        hidden: { opacity: prefersReducedMotion ? 1 : 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : 0.03,
            delayChildren: 0,
          },
        },
        exit: {
          opacity: prefersReducedMotion ? 1 : 0,
          transition: {
            duration: prefersReducedMotion ? 0 : 0.15,
          },
        },
      }) satisfies Variants,
    [prefersReducedMotion]
  );

  const itemVariants = useMemo(
    () =>
      ({
        hidden: {
          opacity: prefersReducedMotion ? 1 : 0,
          y: prefersReducedMotion ? 0 : 10,
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: prefersReducedMotion ? 0 : 0.25,
            ease: defaultEase,
          },
        },
        exit: {
          opacity: prefersReducedMotion ? 1 : 0,
          y: prefersReducedMotion ? 0 : -5,
          transition: {
            duration: prefersReducedMotion ? 0 : 0.15,
          },
        },
      }) satisfies Variants,
    [prefersReducedMotion, defaultEase]
  );

  const pageVariants = useMemo(
    () =>
      ({
        initial: {
          opacity: prefersReducedMotion ? 1 : 0,
          y: prefersReducedMotion ? 0 : 10,
        },
        animate: {
          opacity: 1,
          y: 0,
          transition: {
            duration: prefersReducedMotion ? 0 : 0.2,
            ease: 'easeOut' as const,
          },
        },
        exit: {
          opacity: prefersReducedMotion ? 1 : 0,
          y: prefersReducedMotion ? 0 : -10,
          transition: {
            duration: prefersReducedMotion ? 0 : 0.15,
          },
        },
      }) satisfies Variants,
    [prefersReducedMotion]
  );

  const handleNavigate = (item: NavigableItem) => {
    navigateTo(item);
  };

  const handleOpenLightbox = (item: WorkItem, gallery: WorkItem[]) => {
    openLightbox(item, gallery);
  };

  const handleCloseTextView = () => {
    resetToHome();
  };

  // 渲染內容的函數
  const renderContent = () => {
    if (currentView?.type === 'txt') {
      return (
        <motion.div
          className={`${styles['txt-viewer']} ${theme}`}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          key={`txt-${currentView.data.id}`}
        >
          <motion.div
            className={styles['txt-header']}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              delay: 0.05,
              duration: 0.3,
              ease: defaultEase,
            }}
          >
            <img
              className={styles['txt-icon']}
              src={paperIcon}
              alt="Text file icon"
            />
            <span>{currentView.data.name}</span>
            <motion.button
              onClick={handleCloseTextView}
              className={styles['close-btn']}
              whileHover={
                prefersReducedMotion ? {} : { scale: 1.1, rotate: 90 }
              }
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
            >
              ×
            </motion.button>
          </motion.div>
          <motion.div
            className={styles['txt-content']}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.15,
              duration: 0.3,
              ease: defaultEase,
            }}
          >
            <pre>{currentView.data.content}</pre>
            {currentView.data.id === 'contact' && <ContactForm />}
          </motion.div>
        </motion.div>
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
          <motion.div
            className={styles['folder-empty']}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            key={`folder-${currentView.data.id}`}
          >
            No items in this folder yet.
          </motion.div>
        );
      }

      return (
        <motion.div
          className={styles['folder-content']}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          key={`folder-${currentView.data.id}`}
        >
          {hasFileGridContent && (
            <motion.div
              className={styles['file-grid']}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {bucketSequence.flatMap(bucket => {
                if (bucket === 'folders') {
                  return sortedChildren.map(child => (
                    <motion.div
                      key={child.id}
                      className={styles['file-item']}
                      variants={itemVariants}
                      onClick={() => handleNavigate(child)}
                      whileHover={
                        prefersReducedMotion
                          ? {}
                          : {
                              scale: 1.02,
                              y: -2,
                              transition: { duration: 0.15 },
                            }
                      }
                      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                    >
                      <img
                        className={styles['file-icon']}
                        src={folderIcon}
                        alt="Folder icon"
                      />
                      <div className={styles['file-name']}>{child.name}</div>
                    </motion.div>
                  ));
                }
                if (bucket === 'pages') {
                  return textItems.map(item => (
                    <motion.div
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
                      whileHover={
                        prefersReducedMotion
                          ? {}
                          : {
                              scale: 1.02,
                              y: -2,
                              transition: { duration: 0.15 },
                            }
                      }
                      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                    >
                      <img
                        className={styles['file-icon']}
                        src={paperIcon}
                        alt="Text file icon"
                      />
                      <div className={styles['file-name']}>{item.filename}</div>
                    </motion.div>
                  ));
                }
                return workItems.map(item => (
                  <motion.div
                    key={item.id}
                    className={styles['file-item']}
                    variants={itemVariants}
                    onClick={() => handleOpenLightbox(item, workItems)}
                    whileHover={
                      prefersReducedMotion
                        ? {}
                        : {
                            scale: 1.02,
                            y: -2,
                            transition: { duration: 0.15 },
                          }
                    }
                    whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  >
                    <LazyImage
                      className={styles['file-thumb']}
                      src={'thumb' in item ? item.thumb : ''}
                      alt={item.filename}
                    />
                    <div className={styles['file-name']}>{item.filename}</div>
                  </motion.div>
                ));
              })}
            </motion.div>
          )}
        </motion.div>
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
    const homeFileBucketSequence =
      typeOrder === 'folders-first'
        ? (['folders', 'pages'] as const)
        : (['pages', 'folders'] as const);

    const renderHomeWorksGrid = () => (
      <motion.div
        className={styles['works-grid']}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {sortedHomeItems.map(item => {
          const isTextPage = item.itemType === 'page';
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
            : () => handleOpenLightbox(item, sortedHomeItems);

          return (
            <motion.div
              key={item.id}
              className={styles['work-item']}
              variants={itemVariants}
              onClick={handleClick}
              whileHover={
                prefersReducedMotion
                  ? {}
                  : {
                      scale: 1.02,
                      y: -3,
                      transition: { duration: 0.15 },
                    }
              }
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
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
                />
              )}
              <div className={styles['work-info']}>{item.filename}</div>
            </motion.div>
          );
        })}
      </motion.div>
    );

    return (
      <motion.div
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
        <motion.div
          className={styles['file-grid']}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {homeFileBucketSequence.flatMap(bucket =>
            bucket === 'folders'
              ? sortedFolders.map(folder => (
                  <motion.div
                    key={folder.id}
                    className={styles['file-item']}
                    variants={itemVariants}
                    onClick={() => handleNavigate(folder)}
                    whileHover={
                      prefersReducedMotion
                        ? {}
                        : {
                            scale: 1.02,
                            y: -2,
                            transition: { duration: 0.15 },
                          }
                    }
                    whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  >
                    <img
                      className={styles['file-icon']}
                      src={folderIcon}
                      alt="Folder icon"
                    />
                    <div className={styles['file-name']}>{folder.name}</div>
                  </motion.div>
                ))
              : sortedPages.map(page => (
                  <motion.div
                    key={page.id}
                    className={styles['file-item']}
                    variants={itemVariants}
                    onClick={() => handleNavigate(page)}
                    whileHover={
                      prefersReducedMotion
                        ? {}
                        : {
                            scale: 1.02,
                            y: -2,
                            transition: { duration: 0.15 },
                          }
                    }
                    whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  >
                    <img
                      className={styles['file-icon']}
                      src={paperIcon}
                      alt="Text file icon"
                    />
                    <div className={styles['file-name']}>{page.name}</div>
                  </motion.div>
                ))
          )}
        </motion.div>
        {typeOrder === 'folders-first' &&
          sortedHomeItems.length > 0 &&
          renderHomeWorksGrid()}
      </motion.div>
    );
  };

  // 統一返回，包裹 AnimatePresence
  return <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>;
};

export default ContentView;
