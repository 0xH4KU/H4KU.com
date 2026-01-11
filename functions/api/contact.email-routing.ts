/**
 * Cloudflare Pages Function - Contact Form Handler
 *
 * Handles POST /api/contact requests and sends email via Cloudflare Email Routing.
 *
 * Setup Steps:
 * 1. Enable Email Routing on your domain in Cloudflare Dashboard
 * 2. Add a verified destination email address
 * 3. Create a "Send email" address (e.g., noreply@h4ku.com)
 * 4. Add the send_email binding in Pages Functions settings
 *
 * Required bindings (configure in Cloudflare Dashboard → Pages → Settings → Functions):
 * - send_email: Email Workers binding (type: "send_email", destination_address: "contact@H4KU.com")
 *
 * Required environment variables:
 * - CONTACT_TO_EMAIL: Recipient email address (e.g., contact@H4KU.com)
 * - CONTACT_FROM_EMAIL: Sender email address (must be configured in Email Routing)
 * - TURNSTILE_SECRET_KEY: Cloudflare Turnstile secret key
 */

import {
  verifyTurnstile,
  checkBodySize,
  getCorsHeaders,
  corsPreflightResponse,
  errorResponse,
  successResponse,
  generateSecureReferenceId,
  validateContactPayload,
  escapeHtml,
  maskEmail,
  type ContactPayload,
  type MiddlewareEnv,
} from './_middleware';

// Email message structure for Cloudflare Email Workers
interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

interface Env extends MiddlewareEnv {
  send_email: {
    send: (message: EmailMessage) => Promise<void>;
  };
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
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
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #e5e2dd; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; }
    .header { background: #0f0f0f; color: #c0a88d; padding: 20px; text-align: center; font-family: monospace; border-bottom: 2px solid #c0a88d; }
    .content { background: #1a1a1a; padding: 20px; border: 1px solid #333; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #999; font-size: 12px; text-transform: uppercase; }
    .value { margin-top: 5px; color: #e5e2dd; }
    .message { background: #0f0f0f; padding: 15px; border-left: 3px solid #c0a88d; white-space: pre-wrap; color: #e5e2dd; }
    .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
    .ref { font-family: monospace; background: #333; color: #c0a88d; padding: 2px 6px; border-radius: 3px; }
    a { color: #c0a88d; }
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
  const corsHeaders = getCorsHeaders(request);

  // Check body size before reading
  const bodySizeError = checkBodySize(request);
  if (bodySizeError) {
    return errorResponse(request, bodySizeError, 413);
  }

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify required env vars and bindings
  if (!env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    console.error('Missing required environment variables');
    return errorResponse(request, 'Server configuration error', 500);
  }

  if (!env.send_email) {
    console.error('Missing send_email binding');
    return errorResponse(request, 'Email service not configured', 500);
  }

  // Parse and validate payload
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(request, 'Invalid JSON payload', 400);
  }

  if (!validateContactPayload(payload)) {
    return errorResponse(request, 'Invalid form data', 400);
  }

  // Turnstile human verification
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  const turnstileResult = await verifyTurnstile(
    payload.turnstileToken,
    clientIp,
    env.TURNSTILE_SECRET_KEY
  );
  if (!turnstileResult.success) {
    return errorResponse(request, turnstileResult.error || 'Verification failed', 403);
  }

  const referenceId = generateSecureReferenceId();

  // Create email content
  const { text, html } = createEmailContent(payload, referenceId, clientIp);

  try {
    // Send email via Cloudflare Email Workers
    await env.send_email.send({
      from: env.CONTACT_FROM_EMAIL,
      to: env.CONTACT_TO_EMAIL,
      subject: `[H4KU.com] Contact from ${payload.name}`,
      text,
      html,
      replyTo: payload.email,
    });

    // Log with masked email
    console.log(`Contact form submitted: ${referenceId} from ${maskEmail(payload.email)}`);

    return successResponse(request, {
      message: 'Message sent successfully',
      referenceId,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    return errorResponse(request, 'Failed to send message. Please try again later.', 500);
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction = async (context) => {
  return corsPreflightResponse(context.request);
};
