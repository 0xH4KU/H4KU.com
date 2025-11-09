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
import styles from './ContentView.module.css';

type NavigableItem = Folder | Page;

const ContentView: React.FC = () => {
  const { currentView, navigateTo, openLightbox, resetToHome } =
    useNavigation();
  const { theme } = useTheme();
  const { sortOrder } = useSortOrder();
  const prefersReducedMotion = useReducedMotion();

  // 排序函数
  const sortItems = <T extends { name?: string; filename?: string; date?: string }>(
    items: T[]
  ): T[] => {
    if (sortOrder === 'asc') {
      // 正序(A-Z):直接返回mockData的倒序结果再反转
      return [...items].reverse();
    }
    // 倒序(Z-A):直接返回mockData的倒序结果
    return items;
  };

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
      const textItems = sortItems(items.filter(item => item.itemType === 'page'));
      const workItems = sortItems(items.filter(item => item.itemType !== 'page'));
      const sortedChildren = sortItems(children);
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
              {sortedChildren.map(child => (
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
              ))}
              {textItems.map(item => (
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
                    navigateTo(page);
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
              ))}
              {workItems.map(item => (
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
              ))}
            </motion.div>
          )}
        </motion.div>
      );
    }

    // 主頁
    const sortedFolders = sortItems(mockData.folders);
    const sortedPages = sortItems(mockData.pages);
    const sortedHomeItems = sortItems(mockData.homeItems);

    return (
      <motion.div
        className={styles['folder-content']}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        key="home"
      >
        <motion.div
          className={styles['file-grid']}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {sortedFolders.map(folder => (
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
          ))}
          {sortedPages.map(page => (
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
          ))}
        </motion.div>
        {sortedHomeItems.length > 0 && (
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
                : () => handleOpenLightbox(item, mockData.homeItems);

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
        )}
      </motion.div>
    );
  };

  // 統一返回，包裹 AnimatePresence
  return <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>;
};

export default ContentView;
