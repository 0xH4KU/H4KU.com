/**
 * Cloudflare Pages Function - Contact Form Handler
 *
 * Handles POST /api/contact requests and sends email via Cloudflare Email Routing.
 *
 * Setup Steps:
 * 1. Enable Email Routing on your domain in Cloudflare Dashboard
 * 2. Add a verified destination email address
 * 3. Create a "Send email" address (e.g., noreply@H4KU.COM)
 * 4. Add the send_email binding in Pages Functions settings
 *
 * Required bindings (configure in Cloudflare Dashboard → Pages → Settings → Functions):
 * - send_email: Email Workers binding (type: "send_email", destination_address: "CONTACT@H4KU.COM")
 *
 * Required environment variables:
 * - CONTACT_TO_EMAIL: Recipient email address (e.g., CONTACT@H4KU.COM)
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

// Brand colors - transparent-friendly palette
const colors = {
  primary: '#c0a88d', // Accent - works on both light/dark
  text: '#3d3d3d', // Dark gray - readable on light, inverts to light on dark
  muted: '#6b6b6b', // Mid gray - stays readable when inverted
  border: '#d0d0d0', // Light border - inverts to dark border
} as const;

// Minimal email styles - no background colors, works with Gmail inversion
const emailStyles = `
  <style>
    body { margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: none; }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
`;

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
This message was sent via the H4KU.COM contact form.
`.trim();

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const c = colors;
  const font = "'SF Mono', Monaco, Consolas, 'Courier New', monospace";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>New Message - H4KU.COM</title>
  ${emailStyles}
</head>
<body style="margin: 0; padding: 0; width: 100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="border-bottom: 1px solid ${c.border}; padding-bottom: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: ${font}; color: ${c.primary}; font-size: 13px; letter-spacing: 2px; font-weight: bold;">
                    H4KU.COM
                  </td>
                  <td align="right" style="font-family: ${font}; color: ${c.muted}; font-size: 11px;">
                    ${dateStr} &bull; ${timeStr}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 28px 0 24px 0;">
              <div style="font-family: ${font}; color: ${c.text}; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">
                New Contact Message
              </div>
              <div style="font-family: ${font}; color: ${c.muted}; font-size: 11px; margin-top: 6px;">
                Reference: <span style="color: ${c.primary};">${escapeHtml(referenceId)}</span>
              </div>
            </td>
          </tr>

          <!-- Sender Card -->
          <tr>
            <td style="padding-bottom: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid ${c.border}; border-radius: 4px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-family: ${font}; color: ${c.muted}; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                      From
                    </div>
                    <div style="font-family: ${font}; color: ${c.text}; font-size: 15px; margin-bottom: 4px;">
                      ${escapeHtml(payload.name)}
                    </div>
                    <a href="mailto:${escapeHtml(payload.email)}" style="font-family: ${font}; color: ${c.primary}; text-decoration: none; font-size: 13px;">
                      ${escapeHtml(payload.email)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="font-family: ${font}; color: ${c.muted}; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
                Message
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left: 3px solid ${c.primary};">
                <tr>
                  <td style="padding: 16px 20px; font-family: ${font}; color: ${c.text}; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(payload.message)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid ${c.border}; padding-top: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: ${font}; color: ${c.muted}; font-size: 10px; line-height: 1.6;">
                    IP: ${escapeHtml(clientIp)}
                  </td>
                  <td align="right">
                    <a href="https://H4KU.COM" style="font-family: ${font}; color: ${c.primary}; text-decoration: none; font-size: 11px;">
                      H4KU.COM &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  return { text, html };
}

export const onRequestPost: PagesFunction<Env> = async context => {
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
    return errorResponse(
      request,
      turnstileResult.error || 'Verification failed',
      403
    );
  }

  const referenceId = generateSecureReferenceId();

  // Create email content
  const { text, html } = createEmailContent(payload, referenceId, clientIp);

  try {
    // Send email via Cloudflare Email Workers
    await env.send_email.send({
      from: env.CONTACT_FROM_EMAIL,
      to: env.CONTACT_TO_EMAIL,
      subject: `[H4KU.COM] Contact from ${payload.name}`,
      text,
      html,
      replyTo: payload.email,
    });

    // Log with masked email
    console.log(
      `Contact form submitted: ${referenceId} from ${maskEmail(payload.email)}`
    );

    return successResponse(request, {
      message: 'Message sent successfully',
      referenceId,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    return errorResponse(
      request,
      'Failed to send message. Please try again later.',
      500
    );
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction = async context => {
  return corsPreflightResponse(context.request);
};
