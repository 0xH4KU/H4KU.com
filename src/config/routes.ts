export const ROUTE_SEGMENTS = {
  PAGE: 'page',
  FOLDER: 'folder',
  CONTACT: 'contact',
  VERIFY: 'verify',
} as const;

export const PAGE_IDS = {
  CONTACT: 'contact',
  CONTACT_VERIFY: 'contact-verify',
} as const;

export const ROUTES = {
  CONTACT_VERIFY: `/${ROUTE_SEGMENTS.CONTACT}/${ROUTE_SEGMENTS.VERIFY}`,
} as const;
