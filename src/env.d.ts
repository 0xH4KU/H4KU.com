/// <reference types="vite/client" />
/// <reference types="react" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_CONTACT_ENDPOINT?: string;
  readonly VITE_CONTACT_TIMEOUT?: string;
  readonly VITE_BUILD_ID?: string;
  readonly VITE_BUILD_TIMESTAMP?: string;
  readonly VITE_BUILD_SIGNATURE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __BUILD_ID__: string;
declare const __BUILD_TIMESTAMP__: string;
declare const __BUILD_SIGNATURE__: string;
declare const __BUILD_FINGERPRINT__: string;

interface Window {
  __LUM_BUILD_FINGERPRINT__?: {
    buildId: string;
    timestamp: number;
    version: string;
    environment: 'development' | 'production' | 'test';
    signature?: string;
  };
}
