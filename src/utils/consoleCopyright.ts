import { getActiveFingerprint } from './fingerprint';
import { secureClear, secureLog, secureWarn } from '@/utils/secureConsole';

/**
 * Console Copyright Notice
 *
 * Displays a prominent copyright notice in the browser console
 * to deter unauthorized copying and deployment.
 */

/**
 * Display copyright banner in console
 */
export const displayConsoleCopyright = (): void => {
  if (typeof globalThis === 'undefined' || !globalThis.console) {
    return;
  }

  // ASCII Art Banner
  const banner = `
   ▄█          ███    █▄    ▄▄▄▄███▄▄▄▄         ▀█████████▄   ▄█   ▄██████▄
  ███          ███    ███ ▄██▀▀▀███▀▀▀██▄         ███    ███ ███  ███    ███
  ███          ███    ███ ███   ███   ███         ███    ███ ███▌ ███    ███
  ███          ███    ███ ███   ███   ███        ▄███▄▄▄██▀  ███▌ ███    ███
  ███          ███    ███ ███   ███   ███       ▀▀███▀▀▀██▄  ███▌ ███    ███
  ███          ███    ███ ███   ███   ███         ███    ██▄ ███  ███    ███
  ███▌    ▄    ███    ███ ███   ███   ███         ███    ███ ███  ███    ███
  █████▄▄██    ████████▀   ▀█   ███   █▀        ▄█████████▀  █▀    ▀██████▀
  ▀
`;

  const styles = {
    banner: 'font-family: monospace; color: #00ff00; font-weight: bold;',
    title: 'font-size: 20px; font-weight: bold; color: #ff0000;',
    subtitle: 'font-size: 14px; color: #666;',
    warning: 'font-size: 12px; color: #ff6600; font-weight: bold;',
    info: 'font-size: 11px; color: #0066cc;',
    license: 'font-size: 11px; color: #666; font-style: italic;',
  };

  // Clear console (optional - only in production)
  if (import.meta.env.PROD) {
    secureClear();
  }

  // Display banner
  secureLog('%c' + banner, styles.banner);

  // Main title
  secureLog('%c🔒 PROTECTED SOURCE CODE', styles.title);

  secureLog('%cPersonal Portfolio Website', styles.subtitle);

  secureLog('');

  // Legal notice
  secureLog('%c⚖️  COPYRIGHT NOTICE', styles.warning);

  secureLog(
    '%cThis website and its source code are protected under copyright law.',
    styles.info
  );

  secureLog(
    '%cLicense: Limited Personal Source License (LPSL-1.0)',
    styles.license
  );

  secureLog('');

  // Restrictions
  secureLog('%c❌ RESTRICTIONS:', styles.warning);

  secureLog('%c   • Deployment to other domains is PROHIBITED', styles.info);
  secureLog('%c   • Redistribution is NOT PERMITTED', styles.info);
  secureLog('%c   • Commercial use is STRICTLY FORBIDDEN', styles.info);
  secureLog('%c   • Removing attribution is ILLEGAL', styles.info);

  secureLog('');

  // Permissions
  secureLog('%c✅ ALLOWED:', styles.warning);

  secureLog('%c   • Viewing for personal reference', styles.info);
  secureLog('%c   • Learning from implementation', styles.info);
  secureLog('%c   • Forking for study purposes (not deployment)', styles.info);

  secureLog('');

  // Build info
  if (import.meta.env.PROD) {
    const fingerprint = getActiveFingerprint();
    const buildId =
      fingerprint.buildId || import.meta.env.VITE_BUILD_ID || 'unknown';
    const buildDate =
      import.meta.env.VITE_BUILD_DATE ||
      new Date(fingerprint.timestamp).toISOString();

    secureLog('%c📦 BUILD INFO:', styles.warning);
    secureLog(`%c   Build ID: ${buildId}`, styles.license);
    secureLog(`%c   Build Date: ${buildDate}`, styles.license);
    if (fingerprint.signature) {
      secureLog(`%c   Signature: ${fingerprint.signature}`, styles.license);
    }
    secureLog(
      '%c   Note: This build is fingerprinted and can be traced.',
      styles.info
    );

    secureLog('');
  }

  // Contact info
  secureLog('%c📧 LICENSING INQUIRIES:', styles.warning);
  secureLog(
    '%c   For licensing or permission requests, please open an issue via:',
    styles.info
  );
  secureLog(
    '%c   GitHub: https://github.com/cwlum/lum.bio/issues',
    styles.license
  );
  secureLog(
    '%c   GitLab: https://gitlab.com/lummuu/lum.bio/-/issues',
    styles.license
  );

  secureLog('');

  // Footer
  secureLog(
    '%c────────────────────────────────────────────────────────────────',
    'color: #333;'
  );
  secureLog(
    `%c© ${new Date().getFullYear()} lum. All rights reserved.`,
    styles.license
  );
  secureLog(
    '%cUnauthorized use will result in legal action.',
    'color: #ff0000; font-weight: bold;'
  );
  secureLog('');
};

/**
 * Display a compact version for development
 */
export const displayDevCopyright = (): void => {
  if (typeof globalThis === 'undefined' || !globalThis.console) {
    return;
  }

  secureLog('%c🔒 Protected by LPSL-1.0', 'color: #888; font-size: 10px;');
  secureLog(
    '%cThis code is protected by copyright law. See LICENSE.md for details.',
    'color: #666; font-size: 9px;'
  );
};

/**
 * Anti-debugging message
 */
export const displayAntiDebugWarning = (): void => {
  if (typeof globalThis === 'undefined' || !globalThis.console) {
    return;
  }

  secureWarn(
    '%c⚠️  DEBUGGER DETECTED',
    'font-size: 16px; color: #ff6600; font-weight: bold;'
  );
  secureWarn('This application employs anti-tampering measures.');
  secureWarn('Unauthorized modification or reverse engineering is prohibited.');
};
