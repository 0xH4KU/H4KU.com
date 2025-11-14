import { getActiveFingerprint } from './fingerprint';

/* eslint-disable no-console */

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
  if (typeof console === 'undefined') return;

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
    console.clear();
  }

  // Display banner
  console.log('%c' + banner, styles.banner);

  // Main title
  console.log('%c🔒 PROTECTED SOURCE CODE', styles.title);

  console.log('%cPersonal Portfolio Website', styles.subtitle);

  console.log('');

  // Legal notice
  console.log('%c⚖️  COPYRIGHT NOTICE', styles.warning);

  console.log(
    '%cThis website and its source code are protected under copyright law.',
    styles.info
  );

  console.log(
    '%cLicense: Limited Personal Source License (LPSL-1.0)',
    styles.license
  );

  console.log('');

  // Restrictions
  console.log('%c❌ RESTRICTIONS:', styles.warning);

  console.log('%c   • Deployment to other domains is PROHIBITED', styles.info);
  console.log('%c   • Redistribution is NOT PERMITTED', styles.info);
  console.log('%c   • Commercial use is STRICTLY FORBIDDEN', styles.info);
  console.log('%c   • Removing attribution is ILLEGAL', styles.info);

  console.log('');

  // Permissions
  console.log('%c✅ ALLOWED:', styles.warning);

  console.log('%c   • Viewing for personal reference', styles.info);
  console.log('%c   • Learning from implementation', styles.info);
  console.log(
    '%c   • Forking for study purposes (not deployment)',
    styles.info
  );

  console.log('');

  // Build info
  if (import.meta.env.PROD) {
    const fingerprint = getActiveFingerprint();
    const buildId =
      fingerprint.buildId || import.meta.env.VITE_BUILD_ID || 'unknown';
    const buildDate =
      import.meta.env.VITE_BUILD_DATE ||
      new Date(fingerprint.timestamp).toISOString();

    console.log('%c📦 BUILD INFO:', styles.warning);
    console.log(`%c   Build ID: ${buildId}`, styles.license);
    console.log(`%c   Build Date: ${buildDate}`, styles.license);
    if (fingerprint.signature) {
      console.log(`%c   Signature: ${fingerprint.signature}`, styles.license);
    }
    console.log(
      '%c   Note: This build is fingerprinted and can be traced.',
      styles.info
    );

    console.log('');
  }

  // Contact info
  console.log('%c📧 LICENSING INQUIRIES:', styles.warning);
  console.log(
    '%c   For licensing or permission requests, please open an issue via:',
    styles.info
  );
  console.log(
    '%c   GitHub: https://github.com/cwlum/lum.bio/issues',
    styles.license
  );
  console.log(
    '%c   GitLab: https://gitlab.com/lummuu/lum.bio/-/issues',
    styles.license
  );

  console.log('');

  // Footer
  console.log(
    '%c────────────────────────────────────────────────────────────────',
    'color: #333;'
  );
  console.log(
    `%c© ${new Date().getFullYear()} lum. All rights reserved.`,
    styles.license
  );
  console.log(
    '%cUnauthorized use will result in legal action.',
    'color: #ff0000; font-weight: bold;'
  );
  console.log('');
};

/**
 * Display a compact version for development
 */
export const displayDevCopyright = (): void => {
  if (typeof console === 'undefined') return;

  console.log('%c🔒 Protected by LPSL-1.0', 'color: #888; font-size: 10px;');
  console.log(
    '%cThis code is protected by copyright law. See LICENSE.md for details.',
    'color: #666; font-size: 9px;'
  );
};

/**
 * Anti-debugging message
 */
export const displayAntiDebugWarning = (): void => {
  if (typeof console === 'undefined') return;

  console.warn(
    '%c⚠️  DEBUGGER DETECTED',
    'font-size: 16px; color: #ff6600; font-weight: bold;'
  );
  console.warn('This application employs anti-tampering measures.');
  console.warn(
    'Unauthorized modification or reverse engineering is prohibited.'
  );
};
