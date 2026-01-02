/**
 * Type guard utilities for runtime type checking and TypeScript narrowing.
 * Inspired by Apple App Store's comprehensive type guard patterns.
 */

import type {
  Folder,
  Page,
  WorkItem,
  ImageWorkItem,
  TextWorkItem,
  SearchResult,
  ViewType,
} from '@/types';

// ============================================================================
// WorkItem Type Guards
// ============================================================================

/**
 * Check if a work item is an image work item
 */
export function isImageWorkItem(item: WorkItem): item is ImageWorkItem {
  return item.itemType === 'work';
}

/**
 * Check if a work item is a text/page work item
 */
export function isTextWorkItem(item: WorkItem): item is TextWorkItem {
  return item.itemType === 'page';
}

// ============================================================================
// Navigation Item Type Guards
// ============================================================================

/**
 * Check if an item is a Folder
 */
export function isFolder(item: Folder | Page): item is Folder {
  return item.type === 'folder';
}

/**
 * Check if an item is a Page
 */
export function isPage(item: Folder | Page): item is Page {
  return item.type === 'txt';
}

// ============================================================================
// SearchResult Type Guards
// ============================================================================

/**
 * Check if a search result is a folder result
 */
export function isFolderSearchResult(
  result: SearchResult
): result is Extract<SearchResult, { type: 'folder' }> {
  return result.type === 'folder';
}

/**
 * Check if a search result is a page result
 */
export function isPageSearchResult(
  result: SearchResult
): result is Extract<SearchResult, { type: 'page' }> {
  return result.type === 'page';
}

/**
 * Check if a search result is a work item result
 */
export function isWorkSearchResult(
  result: SearchResult
): result is Extract<SearchResult, { type: 'work' }> {
  return result.type === 'work';
}

// ============================================================================
// ViewType Type Guards
// ============================================================================

/**
 * Check if a view is a folder view
 */
export function isFolderView(
  view: ViewType
): view is Extract<ViewType, { type: 'folder' }> {
  return view.type === 'folder';
}

/**
 * Check if a view is a text/page view
 */
export function isPageView(
  view: ViewType
): view is Extract<ViewType, { type: 'txt' }> {
  return view.type === 'txt';
}

// ============================================================================
// Generic Type Guards
// ============================================================================

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is a non-empty array
 */
export function isNonEmptyArray<T>(value: T[] | null | undefined): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Check if a value is a valid date string (ISO format)
 */
export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Check if a value is a plain object (not null, not array)
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ============================================================================
// Assertion Functions
// ============================================================================

/**
 * Assert that a value is defined, throwing an error if not
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Expected value to be defined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Assert that a condition is true
 */
export function assert(
  condition: boolean,
  message = 'Assertion failed'
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Exhaustive check for switch statements - ensures all cases are handled
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unexpected value: ${value}`);
}
