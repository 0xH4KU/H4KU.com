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

// Brand colors
const colors = {
  primary: '#c0a88d',
  bg: '#1a1a1a',
  surface: '#0f0f0f',
  text: '#e5e2dd',
  muted: '#999999',
  dim: '#666666',
  border: '#333333',
} as const;

// Shared email styles with aggressive Gmail dark mode prevention
const emailStyles = `
  <style>
    :root { color-scheme: light only; }
    body, .body { margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; }
    [data-ogsc] { color: ${colors.text} !important; }
    [data-ogsb] { background-color: ${colors.bg} !important; }
    u + .body { background-color: ${colors.bg} !important; }
    u + .body .bg-main { background-color: ${colors.bg} !important; }
    u + .body .bg-surface { background-color: ${colors.surface} !important; }
    u + .body .text-primary { color: ${colors.primary} !important; }
    u + .body .text-main { color: ${colors.text} !important; }
    u + .body .text-muted { color: ${colors.muted} !important; }
    u + .body .text-dim { color: ${colors.dim} !important; }
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
This message was sent via the H4KU.com contact form.
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
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <meta name="x-apple-disable-message-reformatting">
  <title>New Message - H4KU.com</title>
  ${emailStyles}
</head>
<body class="body bg-main" style="margin: 0; padding: 0; width: 100%; background-color: ${c.bg};">
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: ${c.bg}; opacity: 0;">
    New message from ${escapeHtml(payload.name)} via h4ku.com &#8199;&#65279;&#847;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="body bg-main" style="background-color: ${c.bg};" bgcolor="${c.bg}">
    <tr>
      <td align="center" class="bg-main" style="padding: 32px 16px; background-color: ${c.bg};" bgcolor="${c.bg}">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" class="bg-main" style="max-width: 560px; width: 100%; background-color: ${c.bg};" bgcolor="${c.bg}">

          <!-- Header -->
          <tr>
            <td class="bg-main" style="border-bottom: 1px solid ${c.border}; padding-bottom: 20px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="text-primary" style="font-family: ${font}; color: ${c.primary}; font-size: 13px; letter-spacing: 2px; font-weight: bold;">
                    H4KU.COM
                  </td>
                  <td align="right" class="text-dim" style="font-family: ${font}; color: ${c.dim}; font-size: 11px;">
                    ${dateStr} &bull; ${timeStr}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td class="bg-main" style="padding: 28px 0 24px 0; background-color: ${c.bg};" bgcolor="${c.bg}">
              <div class="text-main" style="font-family: ${font}; color: ${c.text}; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">
                New Contact Message
              </div>
              <div class="text-muted" style="font-family: ${font}; color: ${c.muted}; font-size: 11px; margin-top: 6px;">
                Reference: <span class="text-primary" style="color: ${c.primary};">${escapeHtml(referenceId)}</span>
              </div>
            </td>
          </tr>

          <!-- Sender Card -->
          <tr>
            <td class="bg-main" style="padding-bottom: 20px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-surface" style="background-color: ${c.surface}; border-radius: 4px;" bgcolor="${c.surface}">
                <tr>
                  <td class="bg-surface" style="padding: 16px 20px; background-color: ${c.surface};" bgcolor="${c.surface}">
                    <div class="text-dim" style="font-family: ${font}; color: ${c.dim}; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                      From
                    </div>
                    <div class="text-main" style="font-family: ${font}; color: ${c.text}; font-size: 15px; margin-bottom: 4px;">
                      ${escapeHtml(payload.name)}
                    </div>
                    <a href="mailto:${escapeHtml(payload.email)}" class="text-primary" style="font-family: ${font}; color: ${c.primary}; text-decoration: none; font-size: 13px;">
                      ${escapeHtml(payload.email)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td class="bg-main" style="padding-bottom: 24px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <div class="text-dim" style="font-family: ${font}; color: ${c.dim}; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
                Message
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-surface" style="background-color: ${c.surface}; border-left: 3px solid ${c.primary};" bgcolor="${c.surface}">
                <tr>
                  <td class="bg-surface text-main" style="padding: 16px 20px; font-family: ${font}; color: ${c.text}; font-size: 14px; line-height: 1.7; white-space: pre-wrap; background-color: ${c.surface};" bgcolor="${c.surface}">${escapeHtml(payload.message)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="bg-main" style="border-top: 1px solid ${c.border}; padding-top: 20px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="text-dim" style="font-family: ${font}; color: ${c.dim}; font-size: 10px; line-height: 1.6;">
                    IP: ${escapeHtml(clientIp)}
                  </td>
                  <td align="right">
                    <a href="https://h4ku.com" class="text-primary" style="font-family: ${font}; color: ${c.primary}; text-decoration: none; font-size: 11px;">
                      h4ku.com &rarr;
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
      subject: `[H4KU.com] Contact from ${payload.name}`,
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
