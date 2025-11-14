// Contact endpoint configuration
// Provide VITE_CONTACT_ENDPOINT to route submissions through a server-side handler.

const normalizeEndpoint = (value?: string | null) => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.startsWith('http') || trimmed.startsWith('/')
    ? trimmed
    : `https://${trimmed}`;
};

export const CONTACT_CONFIG = {
  ENDPOINT: normalizeEndpoint(import.meta.env.VITE_CONTACT_ENDPOINT),
  TIMEOUT_MS: (() => {
    const parsed = Number.parseInt(
      import.meta.env.VITE_CONTACT_TIMEOUT ?? '15000',
      10
    );
    return Number.isFinite(parsed) ? parsed : 15000;
  })(),
};

export const isContactEndpointConfigured = () =>
  CONTACT_CONFIG.ENDPOINT.length > 0;
