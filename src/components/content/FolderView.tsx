import React, { useMemo } from 'react';
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
import type { SortOrder, TypeOrder } from '@/contexts/SortContext';
import styles from './ContentView.module.css';

type NavigableItem = Folder | Page;

interface FolderViewProps {
  folder: Folder;
  sortOrder: SortOrder;
  typeOrder: TypeOrder;
  onNavigate: (item: NavigableItem) => void;
  onNavigatePageInCurrentFolder: (page: Page) => void;
  onOpenLightbox: (item: WorkItem, gallery: WorkItem[]) => void;
}

export const FolderView: React.FC<FolderViewProps> = ({
  folder,
  sortOrder,
  typeOrder,
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
      <div className={styles['folder-empty']} key={`folder-${folder.id}`}>
        No items in this folder yet.
      </div>
    );
  }

  return (
    <div className={styles['folder-content']} key={`folder-${folder.id}`}>
      {hasFileGrid && (
        <div className={styles['file-grid']}>
          {bucketSequence.flatMap(bucket => {
            if (bucket === 'folders') {
              return sortedChildren.map(child => (
                <button
                  key={child.id}
                  className={styles['file-item']}
                  type="button"
                  onClick={() => onNavigate(child)}
                >
                  <img
                    className={styles['file-icon']}
                    src={folderIcon}
                    alt="Folder icon"
                    width="96"
                    height="96"
                  />
                  <div className={styles['file-name']}>{child.name}</div>
                </button>
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
                  <button
                    key={item.id}
                    className={styles['file-item']}
                    type="button"
                    onClick={() => onNavigatePageInCurrentFolder(page)}
                  >
                    <img
                      className={styles['file-icon']}
                      src={paperIcon}
                      alt="Text file icon"
                      width="96"
                      height="96"
                    />
                    <div className={styles['file-name']}>{item.filename}</div>
                  </button>
                );
              });
            }

            return workItems.map((item, workIndex) => {
              const shouldPrioritize = workIndex < IMAGE_CONFIG.PRIORITY_COUNT;
              return (
                <button
                  key={item.id}
                  className={styles['file-item']}
                  type="button"
                  onClick={() => onOpenLightbox(item, workItems)}
                >
                  <LazyImage
                    className={styles['file-thumb'] ?? ''}
                    src={'thumb' in item ? item.thumb : ''}
                    alt={item.filename}
                    {...(item.itemType === 'work' && item.sources
                      ? { sources: item.sources }
                      : {})}
                    sizes={IMAGE_CONFIG.GRID_SIZES}
                    priority={shouldPrioritize}
                    fetchPriority={shouldPrioritize ? 'high' : 'auto'}
                  />
                  <div className={styles['file-name']}>{item.filename}</div>
                </button>
              );
            });
          })}
        </div>
      )}
    </div>
  );
};
