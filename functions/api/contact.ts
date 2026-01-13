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

// Brand colors - transparent-friendly palette
const colors = {
  primary: '#c0a88d',
  text: '#3d3d3d',
  muted: '#6b6b6b',
  border: '#d0d0d0',
} as const;

const logoUrl = 'https://h4ku.com/logo/android-chrome-192.png';
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
    body { margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: none; }
    .muted { color: ${colors.muted}; }
    .primary { color: ${colors.primary}; }
    .bordered { border-color: ${colors.border}; }
    .border-top { border-top-color: ${colors.border}; }
    .border-bottom { border-bottom-color: ${colors.border}; }
    .border-left { border-left-color: ${colors.primary}; }
    .btn { border-color: ${colors.primary}; }

    @media (prefers-color-scheme: dark) {
      body, table, td, p, div, span, a, strong { color: #f5f5f5 !important; }
      a { color: #e6d3b8 !important; border-color: #5a5a5a !important; }
      .muted { color: #c8c8c8 !important; }
      .primary { color: #e6d3b8 !important; }
      .bordered { border-color: #5a5a5a !important; }
      .border-top { border-top-color: #5a5a5a !important; }
      .border-bottom { border-bottom-color: #5a5a5a !important; }
      .border-left { border-left-color: #e6d3b8 !important; }
      .btn { border-color: #e6d3b8 !important; color: #f5f5f5 !important; }
    }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
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
  const font =
    "'ProFont', 'SF Mono', Monaco, Consolas, 'Courier New', monospace";
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeMessage = escapeHtml(payload.message);
  const safeReferenceId = escapeHtml(referenceId);
  const safeIp = escapeHtml(clientIp);

  return `
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
<body style="margin: 0; padding: 0; width: 100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 28px 16px 32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%;">

          <!-- Header -->
          <tr>
            <td class="border-bottom" style="border-bottom: 2px solid ${c.border}; padding: 12px 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <a href="https://H4KU.COM" style="text-decoration: none; display: inline-block;">
                      <img src="${logoUrl}" alt="H4KU logo" width="${logoWidth}" style="display: block; height: auto; border: 0;">
                    </a>
                  </td>
                  <td align="right" class="muted" style="font-family: ${font}; color: ${c.muted}; font-size: 11px; line-height: 1.6;">
                    <div class="primary" style="color: ${c.primary}; font-size: 12px; letter-spacing: 1.6px; font-weight: 700;">H4KU.COM</div>
                    <div>${dateStr} &bull; ${timeStr}</div>
                    <div class="muted" style="font-size: 10px; color: ${c.muted}; margin-top: 2px;">Ref ${safeReferenceId}</div>
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
              <div class="muted" style="font-family: ${font}; color: ${c.muted}; font-size: 12px; margin-top: 6px;">
                You can reply directly to this email to reach ${safeName}.
              </div>
            </td>
          </tr>

          <!-- Sender Summary -->
          <tr>
            <td style="padding-bottom: 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bordered" style="border: 2px solid ${c.border}; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <div class="muted" style="font-family: ${font}; color: ${c.muted}; font-size: 10px; text-transform: uppercase; letter-spacing: 1.6px; margin-bottom: 10px;">
                      Summary
                    </div>
                    <div style="font-family: ${font}; color: ${c.text}; font-size: 14px; line-height: 1.7;">
                      <div style="margin-bottom: 6px;"><strong class="primary" style="color: ${c.primary};">From:</strong> ${safeName}</div>
                      <div style="margin-bottom: 6px;">
                        <strong class="primary" style="color: ${c.primary};">Email:</strong>
                        <a href="mailto:${safeEmail}" style="color: ${c.text}; text-decoration: none; border-bottom: 1px dotted ${c.border};">${safeEmail}</a>
                      </div>
                      <div class="muted" style="font-size: 12px; color: ${c.muted};">
                        <strong class="primary" style="color: ${c.primary};">IP:</strong> ${safeIp}
                        <span class="muted" style="color: ${c.muted};"> &bull; ${dateStr} ${timeStr}</span>
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
              <div class="muted" style="font-family: ${font}; color: ${c.muted}; font-size: 10px; text-transform: uppercase; letter-spacing: 1.6px; margin-bottom: 12px;">
                Message
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="border-left" style="border-left: 4px solid ${c.primary};">
                <tr>
                  <td style="padding: 16px 20px; font-family: ${font}; color: ${c.text}; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${safeMessage}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom: 24px;">
              <a href="mailto:${safeEmail}" class="btn" style="display: inline-block; font-family: ${font}; color: ${c.text}; font-size: 12px; padding: 10px 14px; border: 1px solid ${c.primary}; border-radius: 4px; text-decoration: none;">
                Reply to ${safeName}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="border-top" style="border-top: 2px solid ${c.border}; padding-top: 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="muted" style="font-family: ${font}; color: ${c.muted}; font-size: 10px; line-height: 1.6;">
                    Message via <a href="https://H4KU.COM" style="color: ${c.muted}; text-decoration: none; border-bottom: 1px dotted ${c.border};">H4KU.COM/contact</a>
                  </td>
                  <td align="right">
                    <a href="https://H4KU.COM" class="primary" style="font-family: ${font}; color: ${c.primary}; text-decoration: none; font-size: 11px;">
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
}

function createConfirmationEmailHtml(
  payload: ContactPayload,
  referenceId: string
): string {
  const c = colors;
  const font =
    "'ProFont', 'SF Mono', Monaco, Consolas, 'Courier New', monospace";
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeReferenceId = escapeHtml(referenceId);
  const safeMessage = escapeHtml(payload.message);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Message Received - H4KU.COM</title>
  ${emailStyles}
</head>
<body style="margin: 0; padding: 0; width: 100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 28px 16px 32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%;">

          <!-- Header -->
          <tr>
            <td class="border-bottom" style="border-bottom: 2px solid ${c.border}; padding: 12px 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <a href="https://H4KU.COM" style="text-decoration: none; display: inline-block;">
                      <img src="${logoUrl}" alt="H4KU logo" width="${logoWidth}" style="display: block; height: auto; border: 0;">
                    </a>
                  </td>
                  <td align="right" class="muted" style="font-family: ${font}; color: ${c.muted}; font-size: 11px; line-height: 1.6;">
                    <div class="primary" style="color: ${c.primary}; font-size: 12px; letter-spacing: 1.6px; font-weight: 700;">H4KU.COM</div>
                    <div class="muted" style="font-size: 11px; color: ${c.muted};">Ref ${safeReferenceId}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 22px 0 10px 0;">
              <div style="font-family: ${font}; color: ${c.text}; font-size: 18px; font-weight: bold; letter-spacing: 0.5px;">
                Thanks, ${safeName}. Your message is in.
              </div>
              <div class="muted" style="font-family: ${font}; color: ${c.muted}; font-size: 12px; margin-top: 6px;">
                I usually reply within <strong class="primary" style="color: ${c.primary};">3 business days</strong>.
              </div>
            </td>
          </tr>

          <!-- Success Card -->
          <tr>
            <td style="padding-bottom: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bordered" style="border: 2px solid ${c.border}; border-radius: 6px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div class="muted" style="font-family: ${font}; color: ${c.muted}; font-size: 10px; text-transform: uppercase; letter-spacing: 1.6px; margin-bottom: 10px;">
                      Quick summary
                    </div>
                    <div style="font-family: ${font}; color: ${c.text}; font-size: 14px; line-height: 1.7;">
                      <div style="margin-bottom: 8px;">
                        <strong class="primary" style="color: ${c.primary};">Email:</strong>
                        <a href="mailto:${safeEmail}" style="color: ${c.text}; text-decoration: none; border-bottom: 1px dotted ${c.border};">${safeEmail}</a>
                      </div>
                      <div class="muted" style="font-size: 12px; color: ${c.muted};">Reference: ${safeReferenceId}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message echo -->
          <tr>
            <td style="padding-bottom: 22px;">
              <div class="muted" style="font-family: ${font}; color: ${c.muted}; font-size: 10px; text-transform: uppercase; letter-spacing: 1.6px; margin-bottom: 12px;">
                Your message
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="border-left" style="border-left: 4px solid ${c.primary};">
                <tr>
                  <td style="padding: 16px 20px; font-family: ${font}; color: ${c.text}; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${safeMessage}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notice -->
          <tr>
            <td style="padding-bottom: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: ${font}; color: ${c.text}; font-size: 13px; line-height: 1.7;">
                    <span class="primary" style="color: ${c.primary};">&#8250;</span>&nbsp; Add <strong>@H4KU.COM</strong> to your whitelist
                  </td>
                </tr>
                <tr>
                  <td style="font-family: ${font}; color: ${c.text}; font-size: 13px; line-height: 1.7;">
                    <span class="primary" style="color: ${c.primary};">&#8250;</span>&nbsp; Check spam folder if no reply in 3 days
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="border-top" style="border-top: 2px solid ${c.border}; padding-top: 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="muted" style="font-family: ${font}; color: ${c.muted}; font-size: 12px; line-height: 1.6;">
                    Best regards,<br>
                    <span class="primary" style="color: ${c.primary};">HAKU</span>
                  </td>
                  <td align="right" valign="bottom">
                    <a href="https://H4KU.COM" class="primary" style="font-family: ${font}; color: ${c.primary}; text-decoration: none; font-size: 11px;">
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
}

export { createEmailHtml, createConfirmationEmailHtml };

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
          subject: `[H4KU.COM] Contact from ${payload.name}`,
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
            subject: `[H4KU.COM] Message Received - ${referenceId}`,
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
