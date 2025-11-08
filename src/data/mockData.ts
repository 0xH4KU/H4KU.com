import { MockData, Folder, Page, Social } from '@/types';
import { parseFrontmatter } from '@/utils/frontmatter';

/**
 * Load content from files using Vite's import.meta.glob
 * This allows Decap CMS to manage content through file editing
 */

// Load pages (markdown files with frontmatter)
const pagesModules = import.meta.glob<string>(
  '/src/content/pages/*.md',
  { eager: true, query: '?raw', import: 'default' }
);

// Load folders (JSON files)
const foldersModules = import.meta.glob<Folder>(
  '/src/content/folders/*.json',
  { eager: true, import: 'default' }
);

// Load socials (JSON files)
const socialsModules = import.meta.glob<Social>(
  '/src/content/socials/*.json',
  { eager: true, import: 'default' }
);

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
const folders: Folder[] = Object.values(foldersModules);

// Load socials from JSON files
const socials: Social[] = Object.values(socialsModules);

export const mockData: MockData = {
  folders,
  pages,
  socials,
};
