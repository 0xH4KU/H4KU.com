import { Folder } from '@/types';

export interface FlatFolder {
  folder: Folder;
  path: string[];
}

export const flattenFolders = (folders: Folder[], ancestors: string[] = []): FlatFolder[] => {
  const results: FlatFolder[] = [];

  folders.forEach((folder) => {
    const currentPath = [...ancestors, folder.id];
    results.push({ folder, path: currentPath });

    if (folder.children?.length) {
      results.push(...flattenFolders(folder.children, currentPath));
    }
  });

  return results;
};

export const findFolderByPath = (folders: Folder[], path: string[]): Folder | null => {
  if (!path.length) {
    return null;
  }

  let current: Folder | undefined;
  let currentLevel = folders;

  for (const segment of path) {
    current = currentLevel.find((folder) => folder.id === segment);
    if (!current) {
      return null;
    }
    currentLevel = current.children ?? [];
  }

  return current ?? null;
};

export const findFolderPathById = (folders: Folder[], targetId: string): string[] | null => {
  const stack: Array<{ folder: Folder; path: string[] }> = folders.map((folder) => ({
    folder,
    path: [folder.id],
  }));

  while (stack.length) {
    const { folder, path } = stack.pop()!;
    if (folder.id === targetId) {
      return path;
    }

    folder.children?.forEach((child) => {
      stack.push({ folder: child, path: [...path, child.id] });
    });
  }

  return null;
};

export const findFolderById = (folders: Folder[], targetId: string): Folder | null => {
  if (!targetId) {
    return null;
  }

  const stack = [...folders];

  while (stack.length) {
    const folder = stack.pop()!;
    if (folder.id === targetId) {
      return folder;
    }
    if (folder.children?.length) {
      stack.push(...folder.children);
    }
  }

  return null;
};
