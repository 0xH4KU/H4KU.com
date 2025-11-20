import { secureLog, secureWarn } from '@/utils/secureConsole';

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
type DomainMatcher = string | RegExp;

const DEFAULT_AUTHORIZED_DOMAINS: DomainMatcher[] = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'lum.bio',
  'www.lum.bio',
  'lum-bio.pages.dev',
  /.*\.lum-bio\.pages\.dev$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^.+\.localhost$/,
];

const escapeRegExp = (value: string) =>
  value.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');

const normalizeDomainEntry = (entry: string): DomainMatcher | null => {
  if (!entry) {
    return null;
  }

  const trimmed = entry.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('/') && trimmed.endsWith('/')) {
    try {
      return new RegExp(trimmed.slice(1, -1));
    } catch (error) {
      secureWarn('Invalid domain regex provided:', trimmed, error);
      return null;
    }
  }

  if (trimmed.includes('*')) {
    const pattern = '^' + trimmed.split('*').map(escapeRegExp).join('.*') + '$';
    return new RegExp(pattern);
  }

  return trimmed;
};

const getEnvironmentDomains = (): DomainMatcher[] => {
  const raw =
    (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.VITE_ALLOWED_DOMAINS === 'string'
      ? import.meta.env.VITE_ALLOWED_DOMAINS
      : '') || '';

  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map(value => normalizeDomainEntry(value))
    .filter((value): value is DomainMatcher => value !== null);
};

const AUTHORIZED_DOMAINS: DomainMatcher[] = [
  ...getEnvironmentDomains(),
  ...DEFAULT_AUTHORIZED_DOMAINS,
];

const isProdEnv = () =>
  typeof import.meta !== 'undefined' &&
  typeof import.meta.env?.PROD === 'boolean' &&
  import.meta.env.PROD;

/**
 * Domain lock is enforced only in production by default.
 * Opt-out by setting VITE_ENFORCE_DOMAIN_LOCK=false.
 */
const isDomainLockEnabled = () => {
  const raw =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_ENFORCE_DOMAIN_LOCK) ||
    undefined;

  if (typeof raw === 'string') {
    return raw.trim().toLowerCase() !== 'false';
  }

  return isProdEnv();
};

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
  const enforcementEnabled = isDomainLockEnabled();

  return {
    isAuthorized,
    currentDomain: hostname,
    shouldBlock: enforcementEnabled ? !isAuthorized : false,
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
      secureLog(`✅ Domain verified: ${result.currentDomain}`);
    }
  } else {
    secureWarn(
      `%c⚠️  UNAUTHORIZED DEPLOYMENT DETECTED`,
      'color: red; font-size: 14px; font-weight: bold;'
    );
    secureWarn(`%c${result.message}`, 'color: orange; font-size: 12px;');
    secureWarn(
      `%cThis website is protected by copyright law (LPSL-1.0).`,
      'color: orange; font-size: 12px;'
    );
    secureWarn(
      `%cUnauthorized deployment, redistribution, or commercial use is strictly prohibited.`,
      'color: orange; font-size: 12px;'
    );
    secureWarn(
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
