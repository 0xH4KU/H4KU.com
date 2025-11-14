/* eslint-disable no-console */

/**
 * Domain Verification Utility
 *
 * Validates that the application is running on an authorized domain.
 * Displays warnings on unauthorized deployments to deter theft.
 */

/**
 * Authorized domains whitelist
 * Add your production and development domains here
 */
const AUTHORIZED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'lum.bio',
  'www.lum.bio',
  'lum-bio.pages.dev',
  /.*\.lum-bio\.pages\.dev$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
] as const;

/**
 * Check if a domain matches the whitelist
 */
const isDomainAuthorized = (hostname: string): boolean =>
  AUTHORIZED_DOMAINS.some(authorized => {
    if (typeof authorized === 'string') {
      return hostname === authorized;
    }
    return authorized.test(hostname);
  });

/**
 * Domain verification result
 */
export interface DomainCheckResult {
  isAuthorized: boolean;
  currentDomain: string;
  message?: string;
  shouldBlock: boolean;
}

/**
 * Verify the current domain
 */
export const verifyDomain = (): DomainCheckResult => {
  if (typeof window === 'undefined') {
    return {
      isAuthorized: true,
      currentDomain: 'server',
      shouldBlock: false,
    };
  }

  const hostname = window.location.hostname;
  const isAuthorized = isDomainAuthorized(hostname);

  return {
    isAuthorized,
    currentDomain: hostname,
    shouldBlock: !isAuthorized,
    message: isAuthorized
      ? undefined
      : `Unauthorized deployment detected on domain: ${hostname}`,
  };
};

/**
 * Log domain verification to console
 */
export const logDomainVerification = (result: DomainCheckResult): void => {
  if (result.isAuthorized) {
    if (import.meta.env.DEV) {
      console.log(`✅ Domain verified: ${result.currentDomain}`);
    }
  } else {
    console.warn(
      `%c⚠️  UNAUTHORIZED DEPLOYMENT DETECTED`,
      'color: red; font-size: 14px; font-weight: bold;'
    );
    console.warn(`%c${result.message}`, 'color: orange; font-size: 12px;');
    console.warn(
      `%cThis website is protected by copyright law (LPSL-1.0).`,
      'color: orange; font-size: 12px;'
    );
    console.warn(
      `%cUnauthorized deployment, redistribution, or commercial use is strictly prohibited.`,
      'color: orange; font-size: 12px;'
    );
    console.warn(
      `%cLegal action may be taken against violators.`,
      'color: red; font-size: 12px; font-weight: bold;'
    );
  }
};

/**
 * Get the authorized domain list (for display purposes)
 */
export const getAuthorizedDomains = (): string[] => {
  return AUTHORIZED_DOMAINS.filter(d => typeof d === 'string') as string[];
};

/**
 * Domain check hook for React components
 * Returns the verification result and a warning flag
 */
export const useDomainCheck = (): {
  isAuthorized: boolean;
  shouldShowWarning: boolean;
  shouldBlockRendering: boolean;
  domain: string;
} => {
  const result = verifyDomain();

  return {
    isAuthorized: result.isAuthorized,
    shouldShowWarning: !result.isAuthorized,
    shouldBlockRendering: result.shouldBlock,
    domain: result.currentDomain,
  };
};
