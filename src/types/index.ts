// Base work item fields
interface BaseWorkItem {
  id: string;
  filename: string;
  date?: string;
  title?: string;
  description?: string;
  tags?: string[];
  order?: number;
}

// Image work item
export interface ImageWorkItem extends BaseWorkItem {
  itemType: 'work';
  thumb: string;
  full: string;
}

// Text page work item (shown as .txt in folder)
export interface TextWorkItem extends BaseWorkItem {
  itemType: 'page';
  content: string;
}

// Union type for all work items
export type WorkItem = ImageWorkItem | TextWorkItem;

export interface Folder {
  id: string;
  name: string;
  type: 'folder';
  parentId?: string | null;
  description?: string;
  order?: number;
  hidden?: boolean;
  items?: WorkItem[];
  children?: Folder[];
}

export interface Page {
  id: string;
  name: string;
  type: 'txt';
  content: string;
  filename?: string;
  folderId?: string | null;
  date?: string;
  order?: number;
}

export interface Social {
  name: string;
  code: string;
  url: string;
}

export interface MockData {
  folders: Folder[];
  pages: Page[];
  homeItems: WorkItem[];
  socials: Social[];
}

export type ViewType =
  | { type: 'folder'; data: Folder }
  | { type: 'txt'; data: Page };

export type SearchResult =
  | {
      type: 'folder';
      id: string;
      label: string;
      path: string[];
      folder: Folder;
    }
  | {
      type: 'page';
      id: string;
      label: string;
      page: Page;
    }
  | {
      type: 'work';
      id: string;
      label: string;
      path: string[];
      folder: Folder;
      work: WorkItem;
    };
