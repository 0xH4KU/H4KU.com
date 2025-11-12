import { Folder } from '@/types';

export interface FlatFolder {
  folder: Folder;
  path: string[];
}

export interface NavigationMap {
  /** O(1) lookup: folder ID -> Folder object */
  byId: Map<string, Folder>;
  /** O(1) lookup: folder ID -> path array */
  pathById: Map<string, string[]>;
  /** O(1) lookup: path string (joined) -> Folder object */
  byPath: Map<string, Folder>;
  /** All flattened folders for iteration */
  flattened: FlatFolder[];
}

/**
 * Builds a memoizable navigation map for O(1) lookups.
 * This eliminates the need for repeated O(n) tree traversals.
 */
export const buildNavigationMap = (folders: Folder[]): NavigationMap => {
  const byId = new Map<string, Folder>();
  const pathById = new Map<string, string[]>();
  const byPath = new Map<string, Folder>();
  const flattened: FlatFolder[] = [];

  const traverse = (folder: Folder, ancestors: string[] = []) => {
    const currentPath = [...ancestors, folder.id];
    const pathKey = currentPath.join('/');

    // Store in all maps
    byId.set(folder.id, folder);
    pathById.set(folder.id, currentPath);
    byPath.set(pathKey, folder);
    flattened.push({ folder, path: currentPath });

    // Recursively traverse children
    if (folder.children?.length) {
      folder.children.forEach(child => traverse(child, currentPath));
    }
  };

  folders.forEach(folder => traverse(folder));

  return { byId, pathById, byPath, flattened };
};

export const flattenFolders = (
  folders: Folder[],
  ancestors: string[] = []
): FlatFolder[] => {
  const results: FlatFolder[] = [];

  folders.forEach(folder => {
    const currentPath = [...ancestors, folder.id];
    results.push({ folder, path: currentPath });

    if (folder.children?.length) {
      results.push(...flattenFolders(folder.children, currentPath));
    }
  });

  return results;
};

/**
 * O(1) lookup using NavigationMap.
 * Falls back to O(n) tree traversal if map is not provided.
 */
export const findFolderByPath = (
  folders: Folder[],
  path: string[],
  navMap?: NavigationMap
): Folder | null => {
  if (!path.length) {
    return null;
  }

  // O(1) lookup if map is provided
  if (navMap) {
    const pathKey = path.join('/');
    return navMap.byPath.get(pathKey) ?? null;
  }

  // Fallback to O(n) traversal
  let current: Folder | undefined;
  let currentLevel = folders;

  for (const segment of path) {
    current = currentLevel.find(folder => folder.id === segment);
    if (!current) {
      return null;
    }
    currentLevel = current.children ?? [];
  }

  return current ?? null;
};

/**
 * O(1) lookup using NavigationMap.
 * Falls back to O(n) tree traversal if map is not provided.
 */
export const findFolderPathById = (
  folders: Folder[],
  targetId: string,
  navMap?: NavigationMap
): string[] | null => {
  // O(1) lookup if map is provided
  if (navMap) {
    return navMap.pathById.get(targetId) ?? null;
  }

  // Fallback to O(n) traversal
  const stack: Array<{ folder: Folder; path: string[] }> = folders.map(
    folder => ({
      folder,
      path: [folder.id],
    })
  );

  while (stack.length) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    const { folder, path } = current;
    if (folder.id === targetId) {
      return path;
    }

    folder.children?.forEach(child => {
      stack.push({ folder: child, path: [...path, child.id] });
    });
  }

  return null;
};

/**
 * O(1) lookup using NavigationMap.
 * Falls back to O(n) tree traversal if map is not provided.
 */
export const findFolderById = (
  folders: Folder[],
  targetId: string,
  navMap?: NavigationMap
): Folder | null => {
  if (!targetId) {
    return null;
  }

  // O(1) lookup if map is provided
  if (navMap) {
    return navMap.byId.get(targetId) ?? null;
  }

  // Fallback to O(n) traversal
  const stack = [...folders];

  while (stack.length) {
    const folder = stack.pop();
    if (!folder) {
      continue;
    }
    if (folder.id === targetId) {
      return folder;
    }
    if (folder.children?.length) {
      stack.push(...folder.children);
    }
  }

  return null;
};
