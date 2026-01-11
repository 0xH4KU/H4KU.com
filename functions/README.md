# Cloudflare Pages Functions

This directory contains serverless functions that run on Cloudflare Pages.

## Contact Form (`/api/contact`)

Handles contact form submissions with human verification and email notifications.

The frontend uses a two-step flow:
1. **ContactForm** - User fills out the form, data is saved to sessionStorage
2. **ContactVerify** - Turnstile verification is completed, then the API is called

### Security Features

- **Cloudflare Turnstile** - Free CAPTCHA alternative for bot protection
- **CORS whitelist** - Supports `h4ku.com` and `*.h4ku-com.pages.dev` preview deployments
- **Body size limit** - 32KB maximum request size
- **Email masking** - Logs use masked emails (e.g., `us***@ex***.com`)
- **Secure reference IDs** - Generated using `crypto.getRandomValues`

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key (required) |
| `RESEND_API_KEY` | Resend API key for sending emails |
| `CONTACT_TO_EMAIL` | Recipient email address |

### Setup

#### 1. Configure Turnstile

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Turnstile
2. Create a new site and get your Site Key and Secret Key
3. Add `TURNSTILE_SECRET_KEY` to Pages environment variables

#### 2. Choose Email Provider

**Option A: Resend (Recommended)**

Use `functions/api/contact.ts`:

1. Sign up at [resend.com](https://resend.com)
2. Get your API key and verify your domain
3. Set `RESEND_API_KEY` and `CONTACT_TO_EMAIL` in Pages settings

**Option B: Cloudflare Email Routing**

Use `functions/api/contact.email-routing.ts`:

1. Enable Email Routing in Cloudflare Dashboard
2. Add `send_email` binding in Pages Functions settings
3. Set `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL`

**Option C: Discord Webhook**

Use `functions/api/contact.discord.ts`:

1. Create a webhook in your Discord server
2. Set `DISCORD_WEBHOOK_URL` in Pages settings

### Shared Middleware

All contact endpoints use `_middleware.ts` which provides:

- `verifyTurnstile()` - Human verification
- `checkBodySize()` - Request size validation
- `getCorsHeaders()` - CORS with whitelist
- `validateContactPayload()` - Input validation
- `maskEmail()` - Email masking for logs
- `generateSecureReferenceId()` - Cryptographically secure IDs
- `fetchWithTimeout()` - External API calls with timeout

### API Specification

**Request:**
```
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!",
  "turnstileToken": "XXXX.YYYY.ZZZZ"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "referenceId": "HAKU-ABC123"
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| 400 | Invalid form data / Missing verification token |
| 403 | Human verification failed |
| 413 | Request too large |
| 500 | Server configuration error |
| 504 | Service timeout |

### Testing Locally

```bash
# Install wrangler if not already
npm install -g wrangler

# Run local dev server with functions
wrangler pages dev dist \
  --binding TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA \
  --binding RESEND_API_KEY=re_xxx \
  --binding CONTACT_TO_EMAIL=test@example.com
```

Note: Use Turnstile's [testing keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) for local development.

### Deployment

Functions are automatically deployed with your Pages project. Just push to your repository and ensure environment variables are configured in the Cloudflare Pages dashboard.
