export interface WorkItem {
  id: string;
  filename: string;
  thumb: string;
  full: string;
  date: string;
  dimensions: string;
}

export interface Folder {
  id: string;
  name: string;
  type: 'folder';
  items?: WorkItem[];
  children?: Folder[];
}

export interface Page {
  id: string;
  name: string;
  type: 'txt';
  content: string;
}

export interface Social {
  name: string;
  code: string;
  url: string;
}

export interface MockData {
  folders: Folder[];
  pages: Page[];
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
