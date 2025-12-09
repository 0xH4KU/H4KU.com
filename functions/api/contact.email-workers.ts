/**
 * Cloudflare Pages Function - Contact Form Handler
 *
 * Handles POST /api/contact requests and sends email via Cloudflare Email Workers.
 *
 * Required bindings (configure in Cloudflare Dashboard):
 * - EMAIL: Email Workers binding for sending emails
 *
 * Required environment variables:
 * - CONTACT_TO_EMAIL: Recipient email address (e.g., 0x@H4KU.com)
 * - CONTACT_FROM_EMAIL: Sender email address (must be verified in Cloudflare)
 */

interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

interface Env {
  EMAIL: {
    send: (email: EmailMessage) => Promise<void>;
  };
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
}

interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

// Simple rate limiting using KV (optional, can be added later)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // Max 3 requests per minute per IP

function generateReferenceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `HAKU-${timestamp}-${random}`.toUpperCase();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function validatePayload(data: unknown): data is ContactPayload {
  if (!data || typeof data !== 'object') return false;

  const payload = data as Record<string, unknown>;

  if (typeof payload.name !== 'string' || payload.name.trim().length === 0) {
    return false;
  }
  if (typeof payload.email !== 'string' || !isValidEmail(payload.email)) {
    return false;
  }
  if (
    typeof payload.message !== 'string' ||
    payload.message.trim().length === 0
  ) {
    return false;
  }

  // Length limits
  if (payload.name.length > 100) return false;
  if (payload.email.length > 254) return false;
  if (payload.message.length > 5000) return false;

  return true;
}

function isValidEmail(email: string): boolean {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function createEmailContent(
  payload: ContactPayload,
  referenceId: string,
  clientIp: string
): { text: string; html: string } {
  const text = `
New Contact Form Submission
============================

Reference ID: ${referenceId}

From: ${payload.name}
Email: ${payload.email}
IP: ${clientIp}
Time: ${new Date().toISOString()}

Message:
${payload.message}

---
This message was sent via the H4KU.com contact form.
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #0f0; padding: 20px; text-align: center; font-family: monospace; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
    .value { margin-top: 5px; }
    .message { background: #fff; padding: 15px; border-left: 3px solid #0f0; white-space: pre-wrap; }
    .footer { font-size: 12px; color: #999; margin-top: 20px; text-align: center; }
    .ref { font-family: monospace; background: #eee; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin: 0;">H4KU.com Contact</h2>
  </div>
  <div class="content">
    <div class="field">
      <div class="label">Reference ID</div>
      <div class="value"><span class="ref">${escapeHtml(referenceId)}</span></div>
    </div>
    <div class="field">
      <div class="label">From</div>
      <div class="value">${escapeHtml(payload.name)}</div>
    </div>
    <div class="field">
      <div class="label">Email</div>
      <div class="value"><a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></div>
    </div>
    <div class="field">
      <div class="label">Message</div>
      <div class="message">${escapeHtml(payload.message)}</div>
    </div>
  </div>
  <div class="footer">
    Sent via H4KU.com contact form at ${new Date().toISOString()}<br>
    Client IP: ${escapeHtml(clientIp)}
  </div>
</body>
</html>
`.trim();

  return { text, html };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://h4ku.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify required env vars
  if (!env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    console.error('Missing required environment variables');
    return Response.json(
      { success: false, message: 'Server configuration error' },
      { status: 500, headers: corsHeaders }
    );
  }

  // Parse and validate payload
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { success: false, message: 'Invalid JSON payload' },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!validatePayload(payload)) {
    return Response.json(
      { success: false, message: 'Invalid form data' },
      { status: 400, headers: corsHeaders }
    );
  }

  const referenceId = generateReferenceId();
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  // Create email content
  const { text, html } = createEmailContent(payload, referenceId, clientIp);

  try {
    // Send email via Cloudflare Email Workers
    await env.EMAIL.send({
      from: env.CONTACT_FROM_EMAIL,
      to: env.CONTACT_TO_EMAIL,
      subject: `[H4KU.com] Contact from ${payload.name}`,
      text,
      html,
      replyTo: payload.email,
    });

    console.log(`Contact form submitted: ${referenceId} from ${payload.email}`);

    return Response.json(
      {
        success: true,
        message: 'Message sent successfully',
        referenceId,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Failed to send email:', error);
    return Response.json(
      {
        success: false,
        message: 'Failed to send message. Please try again later.',
      },
      { status: 500, headers: corsHeaders }
    );
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://h4ku.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
    },
  });
};
