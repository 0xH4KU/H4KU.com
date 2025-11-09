import type { SortOrder } from '@/contexts/SortContext';

const collator = new Intl.Collator('en', {
  sensitivity: 'base',
  numeric: true,
});

const removeFileExtension = (value: string) => value.replace(/\.[^.]+$/, '');

const NUMERIC_WITH_SEPARATORS = /^\d+(?:[-_/\.]\d+)*$/;
const LEADING_NUMBER = /^\d+/;

const normalizeLabel = (value: string) => value.trim();

const parseNumericLikeValue = (value: string): number | null => {
  const normalized = normalizeLabel(value);
  if (!normalized) {
    return null;
  }

  if (NUMERIC_WITH_SEPARATORS.test(normalized)) {
    return Number(normalized.replace(/[-_/\.]/g, ''));
  }

  const prefixMatch = normalized.match(LEADING_NUMBER);
  if (prefixMatch) {
    return Number(prefixMatch[0]);
  }

  return null;
};

export const deriveSortableLabel = (
  input: string | undefined | null,
  { stripExtension = false }: { stripExtension?: boolean } = {}
) => {
  if (!input) {
    return '';
  }
  const value = stripExtension ? removeFileExtension(input) : input;
  return normalizeLabel(value);
};

export const createLabelComparator = (sortOrder: SortOrder) => {
  const multiplier = sortOrder === 'desc' ? 1 : -1;

  return (rawA: string, rawB: string) => {
    const a = normalizeLabel(rawA);
    const b = normalizeLabel(rawB);

    const numericA = parseNumericLikeValue(a);
    const numericB = parseNumericLikeValue(b);
    const aIsNumeric = numericA !== null;
    const bIsNumeric = numericB !== null;

    if (aIsNumeric && bIsNumeric) {
      if (numericA !== numericB) {
        return (numericB - numericA) * multiplier;
      }
      return collator.compare(a, b) * multiplier;
    }

    if (aIsNumeric !== bIsNumeric) {
      return (aIsNumeric ? -1 : 1) * multiplier;
    }

    return collator.compare(a, b) * multiplier;
  };
};

export const sortByLabel = <T>(
  items: T[] = [],
  sortOrder: SortOrder,
  getLabel: (item: T) => string
): T[] => {
  const comparator = createLabelComparator(sortOrder);
  return [...items].sort((a, b) => comparator(getLabel(a), getLabel(b)));
};

export const getWorkItemLabel = (work: { filename?: string; title?: string; id?: string }) =>
  deriveSortableLabel(work.filename ?? work.title ?? work.id ?? '', {
    stripExtension: true,
  });

export const getPageLabel = (page: { name?: string; filename?: string; id?: string }) =>
  deriveSortableLabel(page.name ?? page.filename ?? page.id ?? '');

export const getFolderLabel = (folder: { name?: string; id?: string }) =>
  deriveSortableLabel(folder.name ?? folder.id ?? '');
