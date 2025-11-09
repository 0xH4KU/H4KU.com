import { MockData, Folder, Page, Social, WorkItem } from '@/types';
import { parseFrontmatter } from '@/utils/frontmatter';

/**
 * Load content from files using Vite's import.meta.glob
 * This allows Decap CMS to manage content through file editing
 */

interface FolderFile {
  id: string;
  name: string;
  type: 'folder';
  parentId?: string | null;
  description?: string;
  order?: number;
  hidden?: boolean;
}

interface WorkFile {
  folderId?: string | null;
  itemType?: 'work' | 'page';
  id: string;
  filename: string;
  date?: string;
  title?: string;
  description?: string;
  tags?: string[];
  order?: number;
  thumb?: string;
  full?: string;
  content?: string;
}

// Load pages (markdown files with frontmatter)
const pagesModules = import.meta.glob<string>('/src/content/pages/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

// Load folders (JSON files)
const foldersModules = import.meta.glob<FolderFile>(
  '/src/content/folders/*.json',
  {
    eager: true,
    import: 'default',
  }
);

// Load socials (JSON files)
const socialsModules = import.meta.glob<Social>('/src/content/socials/*.json', {
  eager: true,
  import: 'default',
});

// Load works (JSON files)
const worksModules = import.meta.glob<WorkFile>('/src/content/works/*.json', {
  eager: true,
  import: 'default',
});

const ORDER_FALLBACK = Number.MAX_SAFE_INTEGER;

const normalizeId = (value: string | null | undefined) => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeOrder = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const compareFolders = (a: Folder, b: Folder) => {
  const orderDiff = (a.order ?? ORDER_FALLBACK) - (b.order ?? ORDER_FALLBACK);
  if (orderDiff !== 0) {
    return orderDiff;
  }
  return a.name.localeCompare(b.name);
};

const comparePages = (a: Page, b: Page) => {
  const orderDiff = (a.order ?? ORDER_FALLBACK) - (b.order ?? ORDER_FALLBACK);
  if (orderDiff !== 0) {
    return orderDiff;
  }
  return a.name.localeCompare(b.name);
};

const sortWorkItems = (items: WorkItem[]): WorkItem[] =>
  [...items].sort((a, b) => {
    const orderDiff = (a.order ?? ORDER_FALLBACK) - (b.order ?? ORDER_FALLBACK);
    if (orderDiff !== 0) {
      return orderDiff;
    }
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

// Build folder map and parent-child relationships
const folderEntries = Object.values(foldersModules);
const folderMap = new Map<string, Folder>();

folderEntries.forEach(entry => {
  folderMap.set(entry.id, {
    id: entry.id,
    name: entry.name,
    type: 'folder',
    parentId: entry.parentId ?? null,
    description: entry.description,
    order: entry.order,
    hidden: entry.hidden,
    children: [],
    items: [],
  });
});

folderMap.forEach(folder => {
  const parentId = normalizeId(folder.parentId as string | null | undefined);
  if (!parentId) {
    folder.parentId = null;
    return;
  }
  const parentFolder = folderMap.get(parentId);
  if (parentFolder) {
    parentFolder.children = parentFolder.children ?? [];
    parentFolder.children.push(folder);
    folder.parentId = parentId;
  } else {
    folder.parentId = null;
  }
});

// Parse pages from markdown files
const parsedPages: Page[] = Object.entries(pagesModules).map(
  ([path, content]) => {
    const { data, content: body } = parseFrontmatter(content);
    const fallbackId = path.split('/').pop()?.replace('.md', '') || '';
    const folderId = normalizeId(data.folderId);
    const filename = data.filename || data.name || 'Untitled.txt';

    return {
      id: data.id || fallbackId,
      name: data.name || filename,
      filename,
      type: 'txt',
      content: body.trim(),
      folderId,
      date: data.date,
      order: normalizeOrder(data.order),
    };
  }
);

const standalonePages = parsedPages
  .filter(page => !page.folderId)
  .sort(comparePages);
const folderPages = parsedPages.filter(page => page.folderId);

// Load works and attach to folders
const works: WorkFile[] = Object.values(worksModules);
const homeItems: WorkItem[] = [];

const pushItemToFolder = (folderId: string | null, item: WorkItem) => {
  if (folderId) {
    const targetFolder = folderMap.get(folderId);
    if (targetFolder) {
      targetFolder.items = targetFolder.items ?? [];
      targetFolder.items.push(item);
      return;
    }
  }
  homeItems.push(item);
};

works.forEach(work => {
  const folderId = normalizeId(work.folderId);
  const type = work.itemType || (work.thumb && work.full ? 'work' : 'page');

  if (type === 'page') {
    const workItem: WorkItem = {
      itemType: 'page',
      id: work.id,
      filename: work.filename,
      date: work.date,
      content: work.content ?? '',
      title: work.title,
      description: work.description,
      tags: work.tags,
      order: normalizeOrder(work.order),
    };
    pushItemToFolder(folderId, workItem);
  } else {
    const imageSource = work.full ?? '';
    const workItem: WorkItem = {
      itemType: 'work',
      id: work.id,
      filename: work.filename,
      date: work.date,
      thumb: work.thumb ?? imageSource,
      full: imageSource,
      title: work.title,
      description: work.description,
      tags: work.tags,
      order: normalizeOrder(work.order),
    };
    pushItemToFolder(folderId, workItem);
  }
});

// Attach folder-assigned pages as text work items
folderPages.forEach(page => {
  const pageItem: WorkItem = {
    itemType: 'page',
    id: page.id,
    filename: page.filename ?? page.name,
    date: page.date,
    content: page.content,
    title: page.name,
    order: page.order,
  };
  pushItemToFolder(page.folderId ?? null, pageItem);
});

const finalizeFolder = (folder: Folder): Folder => {
  const items =
    folder.items && folder.items.length > 0
      ? sortWorkItems(folder.items)
      : undefined;
  const children =
    folder.children && folder.children.length > 0
      ? folder.children
          .filter(child => !child.hidden)
          .sort(compareFolders)
          .map(finalizeFolder)
      : undefined;

  return {
    ...folder,
    items,
    children,
  };
};

const rootFolders = Array.from(folderMap.values()).filter(folder => {
  if (!folder.parentId) {
    return true;
  }
  return !folderMap.has(folder.parentId);
});

const folders: Folder[] = rootFolders
  .filter(folder => !folder.hidden)
  .sort(compareFolders)
  .map(finalizeFolder);

const socials: Social[] = Object.values(socialsModules);

export const mockData: MockData = {
  folders,
  pages: standalonePages,
  homeItems: sortWorkItems(homeItems),
  socials,
};
