import { describe, expect, it, vi } from 'vitest';

type EnvRecord = Record<string, string | undefined>;

const getEnvSnapshot = () => {
  const env = import.meta.env as EnvRecord;
  return {
    VITE_CONTACT_ENDPOINT: env.VITE_CONTACT_ENDPOINT,
    VITE_CONTACT_TIMEOUT: env.VITE_CONTACT_TIMEOUT,
  };
};

const restoreEnv = (snapshot: EnvRecord) => {
  const env = import.meta.env as EnvRecord;
  if (snapshot.VITE_CONTACT_ENDPOINT === undefined) {
    delete env.VITE_CONTACT_ENDPOINT;
  } else {
    env.VITE_CONTACT_ENDPOINT = snapshot.VITE_CONTACT_ENDPOINT;
  }
  if (snapshot.VITE_CONTACT_TIMEOUT === undefined) {
    delete env.VITE_CONTACT_TIMEOUT;
  } else {
    env.VITE_CONTACT_TIMEOUT = snapshot.VITE_CONTACT_TIMEOUT;
  }
};

const loadContactModule = async (overrides: EnvRecord = {}) => {
  const snapshot = getEnvSnapshot();
  const env = import.meta.env as EnvRecord;
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  });
  vi.resetModules();
  const module = await import('../contact');
  restoreEnv(snapshot);
  return module;
};

describe('contact config', () => {
  it('matches normalized endpoint and timeout defaults', async () => {
    const { CONTACT_CONFIG, isContactEndpointConfigured } =
      await loadContactModule();

    const env = import.meta.env as EnvRecord;
    const rawEndpoint = env.VITE_CONTACT_ENDPOINT ?? '/api/contact';
    const rawTimeout = env.VITE_CONTACT_TIMEOUT ?? '15000';

    const expectedEndpoint =
      typeof rawEndpoint !== 'string'
        ? ''
        : rawEndpoint.trim().length === 0
          ? ''
          : rawEndpoint.startsWith('http') || rawEndpoint.startsWith('/')
            ? rawEndpoint.trim()
            : `https://${rawEndpoint.trim()}`;

    const parsedTimeout = Number.parseInt(rawTimeout, 10);
    const expectedTimeout = Number.isFinite(parsedTimeout)
      ? parsedTimeout
      : 15000;

    expect(CONTACT_CONFIG.ENDPOINT).toBe(expectedEndpoint);
    expect(CONTACT_CONFIG.TIMEOUT_MS).toBe(expectedTimeout);
    expect(isContactEndpointConfigured()).toBe(
      CONTACT_CONFIG.ENDPOINT.length > 0
    );
  });

  it('normalizes a hostname to https', async () => {
    const { CONTACT_CONFIG } = await loadContactModule({
      VITE_CONTACT_ENDPOINT: ' example.com ',
    });

    expect(CONTACT_CONFIG.ENDPOINT).toBe('https://example.com');
  });

  it('keeps absolute and relative endpoints unchanged', async () => {
    const { CONTACT_CONFIG: absoluteConfig } = await loadContactModule({
      VITE_CONTACT_ENDPOINT: 'http://api.h4ku.com',
    });
    expect(absoluteConfig.ENDPOINT).toBe('http://api.h4ku.com');

    const { CONTACT_CONFIG: relativeConfig } = await loadContactModule({
      VITE_CONTACT_ENDPOINT: '/worker/contact',
    });
    expect(relativeConfig.ENDPOINT).toBe('/worker/contact');
  });

  it('handles whitespace endpoints as unconfigured', async () => {
    const { CONTACT_CONFIG, isContactEndpointConfigured } =
      await loadContactModule({ VITE_CONTACT_ENDPOINT: '   ' });

    expect(CONTACT_CONFIG.ENDPOINT).toBe('');
    expect(isContactEndpointConfigured()).toBe(false);
  });

  it('falls back to default timeout on invalid values', async () => {
    const { CONTACT_CONFIG } = await loadContactModule({
      VITE_CONTACT_TIMEOUT: 'invalid',
    });

    expect(CONTACT_CONFIG.TIMEOUT_MS).toBe(15000);
  });

  it('parses numeric timeout overrides', async () => {
    const { CONTACT_CONFIG } = await loadContactModule({
      VITE_CONTACT_TIMEOUT: '25000',
    });

    expect(CONTACT_CONFIG.TIMEOUT_MS).toBe(25000);
  });
});
