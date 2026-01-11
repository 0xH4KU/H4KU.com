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
 * - TURNSTILE_SECRET_KEY: Cloudflare Turnstile secret key
 */

import {
  verifyTurnstile,
  checkBodySize,
  getCorsHeaders,
  corsPreflightResponse,
  errorResponse,
  successResponse,
  fetchWithTimeout,
  generateSecureReferenceId,
  validateContactPayload,
  escapeHtml,
  maskEmail,
  API_TIMEOUT_MS,
  type ContactPayload,
  type MiddlewareEnv,
} from './_middleware';

interface Env extends MiddlewareEnv {
  RESEND_API_KEY: string;
  CONTACT_TO_EMAIL: string;
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
    /* Tell email clients NOT to apply dark mode transformations */
    :root { color-scheme: light only; }

    /* Base resets */
    body, .body { margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; }

    /* Gmail-specific dark mode overrides using attribute selectors */
    /* Gmail wraps content and adds data-ogsc (text) and data-ogsb (background) */
    [data-ogsc] { color: ${colors.text} !important; }
    [data-ogsb] { background-color: ${colors.bg} !important; }

    /* Target Gmail's u + .body structure */
    u + .body { background-color: ${colors.bg} !important; }
    u + .body .bg-main { background-color: ${colors.bg} !important; }
    u + .body .bg-surface { background-color: ${colors.surface} !important; }
    u + .body .text-primary { color: ${colors.primary} !important; }
    u + .body .text-main { color: ${colors.text} !important; }
    u + .body .text-muted { color: ${colors.muted} !important; }
    u + .body .text-dim { color: ${colors.dim} !important; }

    /* Prevent color inversion on specific elements */
    .no-dark-invert { color: inherit !important; background-color: inherit !important; }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
    .surface { background-color: ${colors.surface} !important; }
  </style>
  <![endif]-->
`;

function createEmailHtml(
  payload: ContactPayload,
  referenceId: string,
  clientIp: string
): string {
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

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
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
  <!-- Preheader (Gmail preview text) -->
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
}

function createConfirmationEmailHtml(
  payload: ContactPayload,
  referenceId: string
): string {
  const c = colors;
  const font = "'SF Mono', Monaco, Consolas, 'Courier New', monospace";

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <meta name="x-apple-disable-message-reformatting">
  <title>Message Received - H4KU.com</title>
  ${emailStyles}
</head>
<body class="body bg-main" style="margin: 0; padding: 0; width: 100%; background-color: ${c.bg};">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: ${c.bg}; opacity: 0;">
    Your message has been received - h4ku.com &#8199;&#65279;&#847;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="body bg-main" style="background-color: ${c.bg};" bgcolor="${c.bg}">
    <tr>
      <td align="center" class="bg-main" style="padding: 32px 16px; background-color: ${c.bg};" bgcolor="${c.bg}">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" class="bg-main" style="max-width: 560px; width: 100%; background-color: ${c.bg};" bgcolor="${c.bg}">

          <!-- Header -->
          <tr>
            <td class="bg-main" style="border-bottom: 1px solid ${c.border}; padding-bottom: 20px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <span class="text-primary" style="font-family: ${font}; color: ${c.primary}; font-size: 13px; letter-spacing: 2px; font-weight: bold;">
                H4KU.COM
              </span>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td class="bg-main" style="padding: 28px 0 20px 0; background-color: ${c.bg};" bgcolor="${c.bg}">
              <div class="text-main" style="font-family: ${font}; color: ${c.text}; font-size: 16px; line-height: 1.6;">
                Hi ${escapeHtml(payload.name)},
              </div>
            </td>
          </tr>

          <!-- Success Card -->
          <tr>
            <td class="bg-main" style="padding-bottom: 24px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-surface" style="background-color: ${c.surface}; border-radius: 4px;" bgcolor="${c.surface}">
                <tr>
                  <td class="bg-surface" style="padding: 20px 24px; background-color: ${c.surface};" bgcolor="${c.surface}">
                    <div class="text-main" style="font-family: ${font}; color: ${c.text}; font-size: 14px; line-height: 1.8;">
                      <div style="margin-bottom: 14px;">
                        <span class="text-primary" style="color: ${c.primary};">&#10003;</span>&nbsp; Your message has been received.
                      </div>
                      <div style="margin-bottom: 14px;">
                        I'll get back to you within <strong class="text-primary" style="color: ${c.primary};">3 business days</strong>.
                      </div>
                      <div class="text-muted" style="color: ${c.muted}; font-size: 12px; padding-top: 10px; border-top: 1px solid ${c.border};">
                        Reference: ${escapeHtml(referenceId)}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notice -->
          <tr>
            <td class="bg-main" style="padding-bottom: 24px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-surface" style="background-color: ${c.surface}; border-left: 3px solid ${c.primary};" bgcolor="${c.surface}">
                <tr>
                  <td class="bg-surface" style="padding: 16px 20px; background-color: ${c.surface};" bgcolor="${c.surface}">
                    <div class="text-main" style="font-family: ${font}; color: ${c.text}; font-size: 13px; line-height: 1.7;">
                      <div style="margin-bottom: 10px;">
                        <span class="text-primary" style="color: ${c.primary};">&#8250;</span>&nbsp; Add <strong>@h4ku.com</strong> to your whitelist
                      </div>
                      <div class="text-muted" style="color: ${c.muted};">
                        <span class="text-primary" style="color: ${c.primary};">&#8250;</span>&nbsp; Check spam folder if no reply in 3 days
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="bg-main" style="border-top: 1px solid ${c.border}; padding-top: 20px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="text-muted" style="font-family: ${font}; color: ${c.muted}; font-size: 12px; line-height: 1.6;">
                    Best regards,<br>
                    <span class="text-primary" style="color: ${c.primary};">HAKU</span>
                  </td>
                  <td align="right" valign="bottom">
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
}

export const onRequestPost: PagesFunction<Env> = async context => {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request);

  // Check body size before reading
  const bodySizeError = checkBodySize(request);
  if (bodySizeError) {
    return errorResponse(request, bodySizeError, 413);
  }

  // Check required env vars
  if (!env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY');
    return errorResponse(
      request,
      'Server configuration error: Missing API key',
      500
    );
  }

  if (!env.CONTACT_TO_EMAIL) {
    console.error('Missing CONTACT_TO_EMAIL');
    return errorResponse(
      request,
      'Server configuration error: Missing recipient',
      500
    );
  }

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
  const notificationHtml = createEmailHtml(payload, referenceId, clientIp);
  const confirmationHtml = createConfirmationEmailHtml(payload, referenceId);

  try {
    // Send notification email to admin with timeout
    const notificationResponse = await fetchWithTimeout(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'HAKU <contact@h4ku.com>',
          to: [env.CONTACT_TO_EMAIL],
          reply_to: payload.email,
          subject: `[H4KU.com] Contact from ${payload.name}`,
          html: notificationHtml,
        }),
      },
      API_TIMEOUT_MS
    );

    const notificationResult = (await notificationResponse.json()) as Record<
      string,
      unknown
    >;

    if (!notificationResponse.ok) {
      console.error(
        'Resend error:',
        notificationResponse.status,
        JSON.stringify(notificationResult)
      );
      return Response.json(
        {
          success: false,
          message: `Email service error: ${(notificationResult as { message?: string }).message || notificationResponse.status}`,
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Send confirmation email to user (non-blocking, don't fail on error)
    // Use waitUntil to ensure the promise completes even after response is sent
    context.waitUntil(
      fetchWithTimeout(
        'https://api.resend.com/emails',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'HAKU <contact@h4ku.com>',
            to: [payload.email],
            subject: `[H4KU.com] Message Received - ${referenceId}`,
            html: confirmationHtml,
          }),
        },
        API_TIMEOUT_MS
      ).catch(error => {
        // Log but don't fail - confirmation email is nice-to-have
        console.error('Failed to send confirmation email:', error);
      })
    );

    // Log with masked email
    console.log(
      `Contact form submitted: ${referenceId} from ${maskEmail(payload.email)}`
    );

    return successResponse(request, {
      message: 'Message sent successfully',
      referenceId,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Email API timeout');
      return errorResponse(
        request,
        'Email service timeout. Please try again.',
        504
      );
    }
    console.error('Failed to send email:', error);
    return errorResponse(
      request,
      'Failed to send message. Please try again later.',
      500
    );
  }
};

export const onRequestOptions: PagesFunction = async context => {
  return corsPreflightResponse(context.request);
};
