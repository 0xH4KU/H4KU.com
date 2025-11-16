import { Folder, ImageWorkItem, WorkItem } from '@/types';

export const isImageWorkItem = (item: WorkItem): item is ImageWorkItem =>
  item.itemType === 'work';

export const getImageGallery = (folder?: Pick<Folder, 'items'> | null) => {
  if (!folder?.items?.length) {
    return [] as ImageWorkItem[];
  }

  return folder.items.filter(isImageWorkItem);
};
