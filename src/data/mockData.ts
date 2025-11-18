import { MockData, Folder, Page, Social, WorkItem, ImageSource } from '@/types';
// Import aggregated data (built at build time by scripts/build-data.js)
import aggregatedData from '@/content/_aggregated.json';
import {
  verifyIntegrityDual,
  type DualIntegrityCheckResult,
} from '@/utils/integrity';
import { secureWarn } from '@/utils/secureConsole';

/**
 * Load content from aggregated JSON file instead of glob imports.
 * This eliminates multiple eager imports and reduces bundle overhead.
 *
 * To rebuild the aggregated file, run: npm run build:data
 * (This happens automatically during the build process)
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

interface PageFile {
  id?: string;
  filename?: string;
  content: string;
  title?: string;
  folderId?: string | null;
  order?: number | string;
}

interface ImageFile {
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
  avif?: string;
  webp?: string;
  sources?: {
    type?: string;
    srcSet: string;
    media?: string;
  }[];
}

interface AggregatedContent {
  folders?: FolderFile[];
  images?: ImageFile[];
  pages?: PageFile[];
  socials?: Social[];
  _buildTime?: string;
  _integrity?: string;
  _integritySHA256?: string;
}

const rawAggregatedData = aggregatedData as AggregatedContent;

const integrityPayload = {
  folders: rawAggregatedData.folders ?? [],
  images: rawAggregatedData.images ?? [],
  pages: rawAggregatedData.pages ?? [],
  socials: rawAggregatedData.socials ?? [],
};

const integrityResults = verifyIntegrityDual(
  integrityPayload,
  rawAggregatedData._integrity,
  rawAggregatedData._integritySHA256
);

const preferredIntegrity = integrityResults.sha256.expected
  ? integrityResults.sha256
  : integrityResults.fnv1a;

type RuntimeIntegritySummary = {
  expected: string | null;
  actual: string;
  algorithm: 'fnv1a' | 'sha256';
  isValid: boolean;
  details: DualIntegrityCheckResult;
};

export const dataIntegrity: RuntimeIntegritySummary = {
  expected: preferredIntegrity.expected,
  actual: preferredIntegrity.actual,
  algorithm: preferredIntegrity.algorithm,
  isValid: integrityResults.isFullyValid,
  details: integrityResults,
};

if (!integrityResults.isFullyValid) {
  secureWarn(
    '[lum.bio] Content integrity verification failed.\n  • FNV-1a expected %s / actual %s\n  • SHA-256 expected %s / actual %s',
    integrityResults.fnv1a.expected ?? 'missing',
    integrityResults.fnv1a.actual,
    integrityResults.sha256.expected ?? 'missing',
    integrityResults.sha256.actual
  );
}

/**
 * Data is loaded from a single pre-aggregated file.
 * Previously used import.meta.glob with eager:true which required
 * bundling all JSON files separately at build time.
 */
const foldersData = (integrityPayload.folders ?? []) as FolderFile[];
const imagesData = (integrityPayload.images ?? []) as ImageFile[];
const pagesData = (integrityPayload.pages ?? []) as PageFile[];
const socialsData = (integrityPayload.socials ?? []) as Social[];

const ORDER_FALLBACK = Number.MAX_SAFE_INTEGER;

type SourceEntry = NonNullable<ImageFile['sources']>[number];

const isValidSourceEntry = (
  entry: SourceEntry
): entry is SourceEntry & {
  srcSet: string;
} => Boolean(entry?.srcSet && typeof entry.srcSet === 'string');

const buildOptimizedSources = (image: ImageFile) => {
  const sources: ImageSource[] = [];

  if (image.avif) {
    sources.push({
      type: 'image/avif',
      srcSet: image.avif,
    });
  }
  if (image.webp) {
    sources.push({
      type: 'image/webp',
      srcSet: image.webp,
    });
  }
  image.sources?.forEach(source => {
    if (isValidSourceEntry(source)) {
      sources.push({
        type: source.type,
        srcSet: source.srcSet,
        media: source.media,
      });
    }
  });

  return sources.length > 0 ? sources : undefined;
};

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
  // Default to reverse alphabetical (Z-A) so newer folders appear first (for example, 2026 ahead of 2025)
  return b.name.localeCompare(a.name);
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
    // Sort by newest date first
    if (dateA !== dateB) {
      return dateB - dateA;
    }
    // Fall back to reverse filename order (Z-A) to keep newer entries on top
    return b.filename.localeCompare(a.filename);
  });

// Build folder map and parent-child relationships
const folderEntries = foldersData;
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

// Parse pages from aggregated data
const parsedPages: Page[] = pagesData.map(pageData => {
  const fallbackId = pageData.id || 'untitled';
  const filename = pageData.filename || 'Untitled.txt';
  const folderId = normalizeId(pageData.folderId ?? null);

  return {
    id: pageData.id || fallbackId,
    name: pageData.title || filename,
    filename,
    type: 'txt',
    content: pageData.content.trim(),
    folderId,
    date: undefined,
    order: normalizeOrder(pageData.order),
  };
});

const standalonePages = parsedPages
  .filter(page => !page.folderId)
  .sort(comparePages);
const folderPages = parsedPages.filter(page => page.folderId);

// Load images and attach to folders
const images: ImageFile[] = imagesData;
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

images.forEach(work => {
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
      sources: buildOptimizedSources(work),
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

const socials: Social[] = socialsData;

export const mockData: MockData = {
  folders,
  pages: standalonePages,
  homeItems: sortWorkItems(homeItems),
  socials,
};
