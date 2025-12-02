import React, { useMemo } from 'react';
import { m } from 'framer-motion';
import folderIcon from '@/assets/folder.gif';
import paperIcon from '@/assets/paper.gif';
import { Folder, Page, WorkItem } from '@/types';
import { IMAGE_CONFIG } from '@/config/constants';
import {
  getFolderLabel,
  getWorkItemLabel,
  sortByLabel,
} from '@/utils/sortHelpers';
import { filterWorkImages, filterPages } from '@/utils/workItems';
import { LazyImage } from '@/components/common/LazyImage';
import { createHoverAnimation, createTapAnimation } from '@/config/animations';
import type { SortOrder, TypeOrder } from '@/contexts/SortContext';
import type { Variants } from 'framer-motion';
import styles from './ContentView.module.css';

type NavigableItem = Folder | Page;

interface FolderViewProps {
  folder: Folder;
  sortOrder: SortOrder;
  typeOrder: TypeOrder;
  containerVariants: Variants;
  itemVariants: Variants;
  pageVariants: Variants;
  prefersReducedMotion: boolean;
  onNavigate: (item: NavigableItem) => void;
  onNavigatePageInCurrentFolder: (page: Page) => void;
  onOpenLightbox: (item: WorkItem, gallery: WorkItem[]) => void;
}

export const FolderView: React.FC<FolderViewProps> = ({
  folder,
  sortOrder,
  typeOrder,
  containerVariants,
  itemVariants,
  pageVariants,
  prefersReducedMotion,
  onNavigate,
  onNavigatePageInCurrentFolder,
  onOpenLightbox,
}) => {
  const { items = [], children = [] } = folder;

  const { textItems, workItems, sortedChildren, bucketSequence, hasFileGrid } =
    useMemo(() => {
      const text = sortByLabel(filterPages(items), sortOrder, getWorkItemLabel);
      const works = sortByLabel(
        filterWorkImages(items),
        sortOrder,
        getWorkItemLabel
      );
      const childrenSorted = sortByLabel(children, sortOrder, getFolderLabel);
      const sequence =
        typeOrder === 'folders-first'
          ? (['folders', 'pages', 'works'] as const)
          : (['works', 'pages', 'folders'] as const);
      const hasContent =
        children.length > 0 || text.length > 0 || works.length > 0;

      return {
        textItems: text,
        workItems: works,
        sortedChildren: childrenSorted,
        bucketSequence: sequence,
        hasFileGrid: hasContent,
      };
    }, [children, items, sortOrder, typeOrder]);

  if (!items.length && !children.length) {
    return (
      <m.div
        className={styles['folder-empty']}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        key={`folder-${folder.id}`}
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
      key={`folder-${folder.id}`}
    >
      {hasFileGrid && (
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
                  onClick={() => onNavigate(child)}
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
              return textItems.map(item => {
                const page: Page = {
                  id: item.id,
                  name: item.filename,
                  type: 'txt',
                  content: 'content' in item ? item.content : '',
                };

                return (
                  <m.button
                    key={item.id}
                    className={styles['file-item']}
                    type="button"
                    variants={itemVariants}
                    onClick={() => onNavigatePageInCurrentFolder(page)}
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
                );
              });
            }

            return workItems.map((item, workIndex) => {
              const shouldPrioritize = workIndex < IMAGE_CONFIG.PRIORITY_COUNT;
              return (
                <m.button
                  key={item.id}
                  className={styles['file-item']}
                  type="button"
                  variants={itemVariants}
                  onClick={() => onOpenLightbox(item, workItems)}
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
};
