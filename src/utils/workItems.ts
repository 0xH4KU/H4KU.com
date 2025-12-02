import { Folder, ImageWorkItem, WorkItem } from '@/types';

/**
 * Type guard to check if a work item is an image work item
 */
export const isImageWorkItem = (item: WorkItem): item is ImageWorkItem =>
  item.itemType === 'work';

/**
 * Type guard to check if a work item is a page/text item
 */
export const isPageItem = (item: WorkItem): boolean => item.itemType === 'page';

/**
 * Type guard to check if an item is a Folder
 */
export const isFolder = (item: unknown): item is Folder =>
  item !== null &&
  typeof item === 'object' &&
  'type' in item &&
  (item as Folder).type === 'folder';

/**
 * Filter function to get only non-page work items (images, etc.)
 */
export const filterWorkImages = (items: WorkItem[]): WorkItem[] =>
  items.filter(item => !isPageItem(item));

/**
 * Filter function to get only page items
 */
export const filterPages = (items: WorkItem[]): WorkItem[] =>
  items.filter(isPageItem);

export const getImageGallery = (folder?: Pick<Folder, 'items'> | null) => {
  if (!folder?.items?.length) {
    return [] as ImageWorkItem[];
  }

  return folder.items.filter(isImageWorkItem);
};
