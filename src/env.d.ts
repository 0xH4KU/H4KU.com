/// <reference types="vite/client" />
/// <reference types="react" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_CONTACT_ENDPOINT?: string;
  readonly VITE_CONTACT_TIMEOUT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
