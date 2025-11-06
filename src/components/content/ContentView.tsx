import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import folderIcon from '@/assets/folder.gif';
import paperIcon from '@/assets/paper.gif';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { mockData } from '@/data/mockData';
import { Folder, Page, WorkItem } from '@/types';
import { LazyImage } from '@/components/common/LazyImage';
import styles from './ContentView.module.css';

type NavigableItem = Folder | Page;

// 動畫變體配置 - 簡潔直接的動畫
const defaultEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03, // 更快的 stagger
      delayChildren: 0,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
} satisfies Variants;

const itemVariants = {
  hidden: { opacity: 0, y: 10 }, // 更小的移動
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25, // 更快的動畫
      ease: defaultEase, // 自訂 easing，更流暢
    },
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: {
      duration: 0.15,
    },
  },
} satisfies Variants;

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut' as const,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.15,
    },
  },
} satisfies Variants;

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
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
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
          </motion.div>
        </motion.div>
      );
    }

    if (currentView?.type === 'folder') {
      const { items = [], children = [] } = currentView.data;

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
          {children.length > 0 && (
            <motion.div
              className={styles['file-grid']}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {children.map(child => (
                <motion.div
                  key={child.id}
                  className={styles['file-item']}
                  variants={itemVariants}
                  onClick={() => handleNavigate(child)}
                  whileHover={{
                    scale: 1.02,
                    y: -2,
                    transition: { duration: 0.15 },
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img
                    className={styles['file-icon']}
                    src={folderIcon}
                    alt="Folder icon"
                  />
                  <div className={styles['file-name']}>{child.name}</div>
                </motion.div>
              ))}
            </motion.div>
          )}
          {items.length > 0 && (
            <motion.div
              className={styles['works-grid']}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {items.map(item => (
                <motion.div
                  key={item.id}
                  className={styles['work-item']}
                  variants={itemVariants}
                  onClick={() => handleOpenLightbox(item)}
                  whileHover={{
                    scale: 1.02,
                    y: -3,
                    transition: { duration: 0.15 },
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LazyImage src={item.thumb} alt={item.filename} />
                  <div className={styles['work-info']}>{item.filename}</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      );
    }

    // 主頁
    return (
      <motion.div
        className={styles['file-grid']}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        key="home"
      >
        {mockData.folders.map(folder => (
          <motion.div
            key={folder.id}
            className={styles['file-item']}
            variants={itemVariants}
            onClick={() => handleNavigate(folder)}
            whileHover={{
              scale: 1.02,
              y: -2,
              transition: { duration: 0.15 },
            }}
            whileTap={{ scale: 0.98 }}
          >
            <img
              className={styles['file-icon']}
              src={folderIcon}
              alt="Folder icon"
            />
            <div className={styles['file-name']}>{folder.name}</div>
          </motion.div>
        ))}
        {mockData.pages.map(page => (
          <motion.div
            key={page.id}
            className={styles['file-item']}
            variants={itemVariants}
            onClick={() => handleNavigate(page)}
            whileHover={{
              scale: 1.02,
              y: -2,
              transition: { duration: 0.15 },
            }}
            whileTap={{ scale: 0.98 }}
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
    );
  };

  // 統一返回，包裹 AnimatePresence
  return (
    <AnimatePresence mode="wait">
      {renderContent()}
    </AnimatePresence>
  );
};

export default ContentView;
