#!/usr/bin/env node

/**
 * Post-build optimizer
 *
 * - Inline tiny, render-blocking assets (theme-init.js, main CSS) into index.html
 * - Add preload hint for the main JS bundle
 * - Update CSP (index + _headers) with hashes that allow the inlined theme script and CSS
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');
const HEADERS_PATH = path.join(DIST_DIR, '_headers');
const THEME_INIT_PATH = path.join(DIST_DIR, 'theme-init.js');

const read = filePath => fs.readFileSync(filePath, 'utf8');
const write = (filePath, content) =>
  fs.writeFileSync(filePath, content, 'utf8');

const computeHash = content =>
  `sha256-${crypto.createHash('sha256').update(content).digest('base64')}`;

const ensureDistAssets = () => {
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error('dist/index.html not found. Run the Vite build step first.');
  }
};

const inlineThemeInit = html => {
  const inlineMatch =
    /<script[^>]+id=["']theme-init-inline["'][^>]*>([\s\S]*?)<\/script>/i.exec(
      html
    );

  if (inlineMatch) {
    const rawInline = inlineMatch[1].trim();
    const hash = computeHash(rawInline);
    return { html, hash, inlined: false };
  }

  if (!fs.existsSync(THEME_INIT_PATH)) {
    return { html, hash: null, inlined: false };
  }

  const scriptMatch =
    /<script[^>]*src=["']\/theme-init\.js["'][^>]*><\/script>/i.exec(html);
  if (!scriptMatch) {
    return { html, hash: null, inlined: false };
  }

  const rawScript = read(THEME_INIT_PATH).trim();
  const hash = computeHash(rawScript);

  const inlineTag = `<script id="theme-init-inline" data-inline="true">${rawScript}</script>`;
  const nextHtml = html.replace(scriptMatch[0], inlineTag);

  return { html: nextHtml, hash, inlined: true };
};

const inlineMainCss = html => {
  const cssMatch =
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+\.css)["'][^>]*>/i.exec(
      html
    );
  if (!cssMatch) {
    return { html, hash: null, inlined: false };
  }

  const cssHref = cssMatch[1];
  const cssPath = path.join(DIST_DIR, cssHref.replace(/^\//, ''));
  if (!fs.existsSync(cssPath)) {
    return { html, hash: null, inlined: false };
  }

  const cssContent = read(cssPath).trim();
  const hash = computeHash(cssContent);
  const styleTag = `<style data-inline="bundle">${cssContent}</style>`;
  const nextHtml = html.replace(cssMatch[0], styleTag);

  return { html: nextHtml, hash, inlined: true };
};

const addMainPreload = html => {
  const scriptMatch =
    /<script\s+type=["']module["']\s+[^>]*src=["']([^"']*main-[^"']+\.js)["']([^>]*)><\/script>/i.exec(
      html
    );

  if (!scriptMatch) {
    return { html, updated: false };
  }

  const [fullTag, src, tailAttrs] = scriptMatch;
  const hasCrossorigin = /crossorigin/i.test(tailAttrs);
  const preload = `<link rel="preload" href="${src}" as="script"${
    hasCrossorigin ? ' crossorigin' : ''
  } fetchpriority="high">`;

  const alreadyHasPreload = html.includes(preload);

  const needsDefer = !/defer/i.test(fullTag);
  const withDefer = needsDefer
    ? fullTag.replace('<script ', '<script defer ')
    : fullTag;
  const newScriptTag = /fetchpriority=/i.test(withDefer)
    ? withDefer
    : withDefer.replace('<script ', '<script fetchpriority="high" ');

  let replacement = newScriptTag;
  if (!alreadyHasPreload) {
    replacement = `${preload}\n    ${newScriptTag}`;
  }

  return {
    html: html.replace(fullTag, replacement),
    updated: true,
  };
};

const stripModulePreloads = html => {
  // Remove modulepreload hints for non-critical dynamic chunks to cut unused JS downloads
  return html.replace(/^\s*<link\s+rel=["']modulepreload["'][^>]*>\s*$/gim, '');
};

const addSelectiveModulePreloads = html => {
  const assetsDir = path.join(DIST_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) return html;

  const files = fs.readdirSync(assetsDir);
  const pick = prefix =>
    files.find(name => name.startsWith(`${prefix}-`) && name.endsWith('.js'));

  const critical = ['rv', 'icons'].map(prefix => pick(prefix)).filter(Boolean);

  if (!critical.length) return html;

  const scriptMatch =
    /<script\s+[^>]*src=["']\/assets\/main-[^"']+\.js["'][^>]*><\/script>/i.exec(
      html
    );
  if (!scriptMatch) return html;

  const linkTags = critical
    .map(
      file =>
        `<link rel="modulepreload" crossorigin href="/assets/${file}">`
    )
    .join('\n    ');

  const replacement = `${linkTags}\n    ${scriptMatch[0]}`;
  return html.replace(scriptMatch[0], replacement);
};

const addCssPreloads = html => {
  const assetsDir = path.join(DIST_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) return html;

  const files = fs.readdirSync(assetsDir);
  const cssFiles = files.filter(name => /^(Da7-LbzW|BudktrIZ).*\.css$/.test(name));
  if (!cssFiles.length) return html;

  const links = cssFiles
    .map(file => `<link rel="preload" href="/assets/${file}" as="style">`)
    .join('\n    ');

  const marker = '<!-- Critical CSS for faster First Contentful Paint -->';
  return html.replace(marker, `${marker}\n    ${links}`);
};

const injectScriptHashIntoCsp = (policy, hash) => {
  if (!hash) return policy;
  if (policy.includes(hash)) return policy;

  const needle = "script-src 'self'";
  if (!policy.includes(needle)) return policy;

  return policy.replace(needle, `${needle} '${hash}'`);
};

const injectStyleHashIntoCsp = (policy, hash) => {
  if (!hash) return policy;
  if (policy.includes(hash)) return policy;

  // Replace 'unsafe-inline' with the specific hash for better security
  const unsafeInlinePattern = /style-src\s+'self'\s+'unsafe-inline'/;
  if (unsafeInlinePattern.test(policy)) {
    return policy.replace(unsafeInlinePattern, `style-src 'self' '${hash}'`);
  }

  // If no unsafe-inline, just add the hash after 'self'
  const styleSrcPattern = /style-src\s+'self'/;
  if (styleSrcPattern.test(policy)) {
    return policy.replace(styleSrcPattern, `style-src 'self' '${hash}'`);
  }

  return policy;
};

const updateCspPolicy = (policy, { scriptHash, styleHash }) => {
  let updated = policy;
  updated = injectScriptHashIntoCsp(updated, scriptHash);
  updated = injectStyleHashIntoCsp(updated, styleHash);
  return updated;
};

const updateCspMeta = (html, hashes) => {
  return html.replace(
    /(<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]+content=["'])([^"]+)(["'][^>]*>)/i,
    (_, prefix, content, suffix) =>
      `${prefix}${updateCspPolicy(content, hashes)}${suffix}`
  );
};

const updateHeadersFile = (hashes, headersPath = HEADERS_PATH) => {
  if (!fs.existsSync(headersPath)) {
    return;
  }

  const content = read(headersPath);
  const updated = content.replace(
    /(Content-Security-Policy:\s*)([^\n]+)/,
    (_, prefix, policy) => `${prefix}${updateCspPolicy(policy, hashes)}`
  );

  write(headersPath, updated);
};

const run = () => {
  ensureDistAssets();

  let html = read(INDEX_PATH);

  const cssResult = inlineMainCss(html);
  html = cssResult.html;

  const { html: htmlWithTheme, hash: themeHash } = inlineThemeInit(html);
  html = htmlWithTheme;

  const preloadResult = addMainPreload(html);
  html = preloadResult.html;

  html = stripModulePreloads(html);
  html = addSelectiveModulePreloads(html);
  html = addCssPreloads(html);

  const cspHashes = {
    scriptHash: themeHash,
    styleHash: cssResult.hash,
  };

  html = updateCspMeta(html, cspHashes);

  write(INDEX_PATH, html);
  updateHeadersFile(cspHashes);

  const messages = [];
  if (cssResult.inlined) messages.push('inline css');
  if (cssResult.hash) messages.push('css hash injected');
  if (themeHash) messages.push('inline theme-init');
  if (preloadResult.updated) messages.push('preload main bundle');

  console.log(
    `Post-build optimization complete: ${messages.length ? messages.join(', ') : 'no changes'}`
  );
};

run();
