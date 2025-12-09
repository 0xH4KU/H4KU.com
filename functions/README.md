# Cloudflare Pages Functions

This directory contains serverless functions that run on Cloudflare Pages.

## Contact Form (`/api/contact`)

Handles contact form submissions and sends email notifications.

### Setup Options

#### Option 1: Cloudflare Email Routing (Recommended)

1. **Enable Email Routing** in Cloudflare Dashboard:
   - Go to your domain → Email → Email Routing
   - Add a custom address (e.g., `contact@h4ku.com`)
   - Route it to your personal email

2. **Create Email Workers binding**:
   - Go to Workers & Pages → Your project → Settings → Functions
   - Add binding: `EMAIL` → Select your email routing

3. **Set environment variables** in Cloudflare Dashboard:
   ```
   CONTACT_TO_EMAIL=0x@H4KU.com
   CONTACT_FROM_EMAIL=noreply@h4ku.com
   ```

#### Option 2: MailChannels (Free, No Setup)

Replace `functions/api/contact.ts` with `functions/api/contact.mailchannels.ts`:

MailChannels is free for Cloudflare Workers and requires no additional setup.

#### Option 3: Webhook (Discord/Telegram)

Use `functions/api/contact.webhook.ts` to send notifications to Discord or Telegram instead of email.

### Testing Locally

```bash
# Install wrangler if not already
npm install -g wrangler

# Run local dev server with functions
wrangler pages dev dist --binding CONTACT_TO_EMAIL=test@example.com CONTACT_FROM_EMAIL=noreply@h4ku.com
```

### Deployment

Functions are automatically deployed with your Pages project. Just push to your repository.

### API Specification

**Request:**
```
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "referenceId": "HAKU-ABC123"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```
