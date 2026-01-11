import { defineConfig, devices } from '@playwright/test';

const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost', '::1'];
const existingNoProxy = process.env.NO_PROXY || process.env.no_proxy || '';
const mergedNoProxy = Array.from(
  new Set([
    ...existingNoProxy
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean),
    ...LOOPBACK_HOSTS,
  ])
).join(',');

process.env.NO_PROXY = mergedNoProxy;
process.env.no_proxy = mergedNoProxy;

const HOST = process.env.E2E_HOST || '127.0.0.1';
const PORT = process.env.E2E_PORT || 4173;
const BASE_URL = `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    headless: true,
    launchOptions: {
      args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
    },
    firefoxUserPrefs: {
      'network.proxy.type': 0,
      'network.proxy.no_proxies_on': '127.0.0.1,localhost,::1',
      'network.proxy.allow_hijacking_localhost': false,
      'network.proxy.socks_remote_dns': false,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host ${HOST} --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      NO_PROXY: mergedNoProxy,
      no_proxy: mergedNoProxy,
      VITE_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
      VITE_TURNSTILE_BYPASS_TOKEN: 'e2e-bypass-token',
    },
  },
});
