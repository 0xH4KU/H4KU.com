// Contact endpoint configuration
// 1. Create a Cloudflare Worker, Pages Function, or any HTTPS endpoint that handles POST /contact payloads
// 2. Ensure the endpoint validates honeypot/rate limiting server-side and delivers email/Discord/etc.
// 3. Expose the endpoint via an environment variable:
//    VITE_CONTACT_ENDPOINT="https://api.example.com/contact"

export const CONTACT_CONFIG = {
  ENDPOINT: 'https://api.example.com/contact',
  TIMEOUT_MS: 15000,
};

export const isContactEndpointConfigured = () => true;
