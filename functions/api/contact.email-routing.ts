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

const logoUrl =
  'data:image/png;base64,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';
const logoWidth = 60;

// Minimal email styles - no background colors, works with Gmail inversion
const emailStyles = `
  <style>
    @font-face {
      font-family: 'ProFont';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src:
        url('https://h4ku.com/fonts/ProFont.woff2') format('woff2'),
        url('https://h4ku.com/fonts/ProFont.woff') format('woff');
    }
    @font-face {
      font-family: 'ProFont';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src:
        url('https://h4ku.com/fonts/ProFont-Bold.woff2') format('woff2'),
        url('https://h4ku.com/fonts/ProFont-Bold.woff') format('woff');
    }
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body, table, td { background-color: transparent !important; }
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
  const font =
    "'ProFont', 'SF Mono', Monaco, Consolas, 'Courier New', monospace";
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeMessage = escapeHtml(payload.message);
  const safeReferenceId = escapeHtml(referenceId);
  const safeIp = escapeHtml(clientIp);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>New Message - H4KU.COM</title>
  ${emailStyles}
</head>
<body style="margin: 0; padding: 0; width: 100%; background: transparent;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 28px 16px 32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="border-bottom: 2px solid ${c.border}; padding: 12px 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <a href="https://H4KU.COM" style="text-decoration: none; display: inline-block;">
                      <img src="${logoUrl}" alt="H4KU logo" width="${logoWidth}" style="display: block; height: auto; border: 0;">
                    </a>
                  </td>
                  <td align="right" style="font-family: ${font}; color: ${c.muted}; font-size: 11px; line-height: 1.6;">
                    <div style="color: ${c.primary}; font-size: 12px; letter-spacing: 1.6px; font-weight: 700;">H4KU.COM</div>
                    <div>${dateStr} &bull; ${timeStr}</div>
                    <div style="font-size: 10px; color: ${c.muted}; margin-top: 2px;">Ref ${safeReferenceId}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 22px 0 10px 0;">
              <div style="font-family: ${font}; color: ${c.text}; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">
                New Contact Message
              </div>
              <div style="font-family: ${font}; color: ${c.muted}; font-size: 12px; margin-top: 6px;">
                You can reply directly to this email to reach ${safeName}.
              </div>
            </td>
          </tr>

          <!-- Sender Summary -->
          <tr>
            <td style="padding-bottom: 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 2px solid ${c.border}; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <div style="font-family: ${font}; color: ${c.muted}; font-size: 10px; text-transform: uppercase; letter-spacing: 1.6px; margin-bottom: 10px;">
                      Summary
                    </div>
                    <div style="font-family: ${font}; color: ${c.text}; font-size: 14px; line-height: 1.7;">
                      <div style="margin-bottom: 6px;"><strong style="color: ${c.primary};">From:</strong> ${safeName}</div>
                      <div style="margin-bottom: 6px;">
                        <strong style="color: ${c.primary};">Email:</strong>
                        <a href="mailto:${safeEmail}" style="color: ${c.text}; text-decoration: none; border-bottom: 1px dotted ${c.border};">${safeEmail}</a>
                      </div>
                      <div style="font-size: 12px; color: ${c.muted};">
                        <strong style="color: ${c.primary};">IP:</strong> ${safeIp}
                        <span style="color: ${c.muted};"> &bull; ${dateStr} ${timeStr}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding-bottom: 22px;">
              <div style="font-family: ${font}; color: ${c.muted}; font-size: 10px; text-transform: uppercase; letter-spacing: 1.6px; margin-bottom: 12px;">
                Message
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left: 4px solid ${c.primary};">
                <tr>
                  <td style="padding: 16px 20px; font-family: ${font}; color: ${c.text}; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${safeMessage}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom: 24px;">
              <a href="mailto:${safeEmail}" style="display: inline-block; font-family: ${font}; color: ${c.text}; font-size: 12px; padding: 10px 14px; border: 1px solid ${c.primary}; border-radius: 4px; text-decoration: none;">
                Reply to ${safeName}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 2px solid ${c.border}; padding-top: 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: ${font}; color: ${c.muted}; font-size: 10px; line-height: 1.6;">
                    Message via <a href="https://H4KU.COM" style="color: ${c.muted}; text-decoration: none; border-bottom: 1px dotted ${c.border};">H4KU.COM/contact</a>
                  </td>
                  <td align="right">
                    <a href="https://H4KU.COM" style="font-family: ${font}; color: ${c.primary}; text-decoration: none; font-size: 11px;">
                      Visit site &rarr;
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
