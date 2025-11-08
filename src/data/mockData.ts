import { MockData, Folder, Page, Social, WorkItem } from '@/types';
import { parseFrontmatter } from '@/utils/frontmatter';

/**
 * Load content from files using Vite's import.meta.glob
 * This allows Decap CMS to manage content through file editing
 */

// Load pages (markdown files with frontmatter)
const pagesModules = import.meta.glob<string>('/src/content/pages/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

// Load folders (JSON files)
const foldersModules = import.meta.glob<Folder>('/src/content/folders/*.json', {
  eager: true,
  import: 'default',
});

// Load socials (JSON files)
const socialsModules = import.meta.glob<Social>('/src/content/socials/*.json', {
  eager: true,
  import: 'default',
});

// Load works (JSON files)
interface WorkFile extends WorkItem {
  folderId: string;
}

const worksModules = import.meta.glob<WorkFile>('/src/content/works/*.json', {
  eager: true,
  import: 'default',
});

// Parse pages from markdown files
const pages: Page[] = Object.entries(pagesModules).map(([path, content]) => {
  const { data, content: body } = parseFrontmatter(content);
  return {
    id: data.id || path.split('/').pop()?.replace('.md', '') || '',
    name: data.name || 'Untitled.txt',
    type: 'txt',
    content: body.trim(),
  };
});

// Load folders from JSON files
const baseFolders: Folder[] = Object.values(foldersModules);

// Load works and group by folderId
const works: WorkFile[] = Object.values(worksModules);
const worksByFolder = new Map<string, WorkItem[]>();

works.forEach(work => {
  const { folderId, ...workItem } = work;
  if (!worksByFolder.has(folderId)) {
    worksByFolder.set(folderId, []);
  }
  const folderWorks = worksByFolder.get(folderId);
  if (folderWorks) {
    folderWorks.push(workItem);
  }
});

// Recursively attach works to folders
function attachWorksToFolder(folder: Folder): Folder {
  const updatedFolder = { ...folder };

  // Attach works to this folder if any
  const folderWorks = worksByFolder.get(folder.id);
  if (folderWorks && folderWorks.length > 0) {
    updatedFolder.items = folderWorks.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  // Recursively process children
  if (folder.children) {
    updatedFolder.children = folder.children.map(attachWorksToFolder);
  }

  return updatedFolder;
}

// Attach works to folders
const folders: Folder[] = baseFolders.map(attachWorksToFolder);

// Load socials from JSON files
const socials: Social[] = Object.values(socialsModules);

export const mockData: MockData = {
  folders,
  pages,
  socials,
};
