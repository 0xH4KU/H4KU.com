// Contact endpoint configuration
// Defaults to a relative Pages/Workers route so Cloudflare Email Worker deployments
// work out of the box on the same domain.

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
  // Prefer env override; fall back to a same-origin Pages/Workers route
  ENDPOINT: normalizeEndpoint(
    import.meta.env.VITE_CONTACT_ENDPOINT ?? '/api/contact'
  ),
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
