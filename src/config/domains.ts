export const APP_DOMAIN = 'h4ku.com' as const;
export const WWW_APP_DOMAIN = 'www.h4ku.com' as const;
export const API_DOMAIN = 'api.h4ku.com' as const;

export const APP_ORIGIN = `https://${APP_DOMAIN}` as const;
export const WWW_APP_ORIGIN = `https://${WWW_APP_DOMAIN}` as const;
export const API_ORIGIN = `https://${API_DOMAIN}` as const;

export const CF_PAGES_PROJECT_DOMAIN = 'h4ku-com.pages.dev' as const;
export const CF_PAGES_PREVIEW_ORIGIN_REGEX =
  /^https:\/\/[a-z0-9-]+\.h4ku-com\.pages\.dev$/i;
