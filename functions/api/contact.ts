/**
 * Cloudflare Pages Function - Contact Form Handler (Resend)
 *
 * Uses Resend API for sending emails.
 * Free tier: 100 emails/day, 3000 emails/month
 *
 * Setup:
 * 1. Sign up at https://resend.com
 * 2. Get your API key from dashboard
 * 3. Add your domain (or use onboarding@resend.dev for testing)
 * 4. Set environment variable: RESEND_API_KEY
 *
 * Required environment variables:
 * - RESEND_API_KEY: Your Resend API key
 * - CONTACT_TO_EMAIL: Recipient email address
 */

interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

interface Env {
  RESEND_API_KEY: string;
  CONTACT_TO_EMAIL: string;
}

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

  if (payload.name.length > 100) return false;
  if (payload.email.length > 254) return false;
  if (payload.message.length > 5000) return false;

  return true;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function createEmailHtml(
  payload: ContactPayload,
  referenceId: string,
  clientIp: string
): string {
  return `
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
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://h4ku.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
  };

  // Check required env vars
  if (!env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY');
    return Response.json(
      { success: false, message: 'Server configuration error: Missing API key' },
      { status: 500, headers: corsHeaders }
    );
  }

  if (!env.CONTACT_TO_EMAIL) {
    console.error('Missing CONTACT_TO_EMAIL');
    return Response.json(
      { success: false, message: 'Server configuration error: Missing recipient' },
      { status: 500, headers: corsHeaders }
    );
  }

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
  const html = createEmailHtml(payload, referenceId, clientIp);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'H4KU.com <0x@h4ku.com>',
        to: [env.CONTACT_TO_EMAIL],
        reply_to: payload.email,
        subject: `[H4KU.com] Contact from ${payload.name}`,
        html: html,
      }),
    });

    const result = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      console.error('Resend error:', response.status, JSON.stringify(result));
      return Response.json(
        {
          success: false,
          message: `Email service error: ${(result as { message?: string }).message || response.status}`,
        },
        { status: 500, headers: corsHeaders }
      );
    }

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

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://h4ku.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
    },
  });
};
