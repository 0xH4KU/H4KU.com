import { Folder, Page, SearchResult, WorkItem } from '@/types';
import { getImageGallery, isImageWorkItem } from '@/utils/workItems';

export type SearchNavigateHandler = (
  item: Folder | Page,
  pathOverride?: string[]
) => void;

export type LightboxHandler = (image: WorkItem, gallery: WorkItem[]) => void;

interface NavigateOptions {
  navigateTo: SearchNavigateHandler;
  openLightbox: LightboxHandler;
}

const createPageFromWorkItem = (work: WorkItem): Page => ({
  id: work.id,
  name: work.filename,
  filename: work.filename,
  type: 'txt',
  content: 'content' in work ? work.content : '',
});

export const navigateFromSearchResult = (
  result: SearchResult,
  { navigateTo, openLightbox }: NavigateOptions
): boolean => {
  if (result.type === 'folder') {
    navigateTo(result.folder, result.path);
    return true;
  }

  if (result.type === 'page') {
    navigateTo(result.page);
    return true;
  }

  if (result.type === 'work') {
    if (result.work.itemType === 'page') {
      const page = createPageFromWorkItem(result.work);
      navigateTo(page, result.path);
      return true;
    }

    if (isImageWorkItem(result.work)) {
      const gallery = getImageGallery(result.folder);
      if (gallery.length > 0) {
        openLightbox(result.work, gallery);
        return true;
      }
    }
  }

  return false;
};
