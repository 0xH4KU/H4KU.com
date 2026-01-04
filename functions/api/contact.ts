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

// Shared email styles to prevent Gmail dark mode inversion
const emailStyles = `
  <style>
    /* Force dark mode and prevent Gmail inversion */
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body, .body { background-color: #1a1a1a !important; }
    /* Gmail dark mode targeting */
    u + .body .gmail-fix { background-color: #1a1a1a !important; }
    @media (prefers-color-scheme: dark) {
      .body, .container, .surface { background-color: #1a1a1a !important; }
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

  const c = {
    primary: '#c0a88d',
    bg: '#1a1a1a',
    surface: '#0f0f0f',
    text: '#e5e2dd',
    muted: '#999999',
    dim: '#666666',
    border: '#333333',
  };

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <meta name="x-apple-disable-message-reformatting">
  <title>New Message - H4KU.com</title>
  ${emailStyles}
</head>
<body class="body" style="margin: 0; padding: 0; width: 100%; background-color: ${c.bg}; -webkit-text-size-adjust: none; -ms-text-size-adjust: none;">
  <!-- Gmail dark mode fix wrapper -->
  <div class="gmail-fix" style="display: none; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; background-color: ${c.bg};">
    New message from ${escapeHtml(payload.name)} via h4ku.com
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="body" style="background-color: ${c.bg};" bgcolor="${c.bg}">
    <tr>
      <td align="center" style="padding: 32px 16px; background-color: ${c.bg};" bgcolor="${c.bg}">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" class="container" style="max-width: 560px; width: 100%; background-color: ${c.bg};" bgcolor="${c.bg}">

          <!-- Display Issue Notice -->
          <tr>
            <td align="center" style="padding-bottom: 16px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 10px; color: ${c.dim}; letter-spacing: 0.5px;">
                Email not displaying correctly? Try disabling dark mode.
              </span>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="border-top: 2px solid ${c.border}; padding: 24px 0; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.primary}; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-weight: bold; background-color: ${c.bg};" bgcolor="${c.bg}">
                    H4KU.COM
                  </td>
                  <td align="right" style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.dim}; font-size: 11px; letter-spacing: 1px; background-color: ${c.bg};" bgcolor="${c.bg}">
                    ${dateStr} | ${timeStr}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title Block -->
          <tr>
            <td style="padding: 0 0 24px 0; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="surface" style="background-color: ${c.surface}; border: 2px solid ${c.border};" bgcolor="${c.surface}">
                <tr>
                  <td style="padding: 20px 24px; background-color: ${c.surface};" bgcolor="${c.surface}">
                    <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.text}; font-size: 18px; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 8px;">
                      NEW MESSAGE
                    </div>
                    <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.dim}; font-size: 11px; letter-spacing: 1px;">
                      REF: ${escapeHtml(referenceId)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Sender Info -->
          <tr>
            <td style="padding-bottom: 24px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.muted}; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; padding-bottom: 10px; background-color: ${c.bg};" bgcolor="${c.bg}">
                    From
                  </td>
                </tr>
                <tr>
                  <td style="background-color: ${c.bg};" bgcolor="${c.bg}">
                    <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.text}; font-size: 15px; padding-bottom: 4px;">
                      ${escapeHtml(payload.name)}
                    </div>
                    <div>
                      <a href="mailto:${escapeHtml(payload.email)}" style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.primary}; text-decoration: none; font-size: 13px; border-bottom: 1px solid ${c.primary};">
                        ${escapeHtml(payload.email)}
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Content -->
          <tr>
            <td style="padding-bottom: 24px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.muted}; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; padding-bottom: 12px; background-color: ${c.bg};" bgcolor="${c.bg}">
                    Message
                  </td>
                </tr>
                <tr>
                  <td style="background-color: ${c.bg};" bgcolor="${c.bg}">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="surface" style="background-color: ${c.surface}; border-left: 2px solid ${c.primary};" bgcolor="${c.surface}">
                      <tr>
                        <td style="padding: 20px; font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.text}; font-size: 14px; line-height: 1.8; white-space: pre-wrap; background-color: ${c.surface};" bgcolor="${c.surface}">${escapeHtml(payload.message)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 2px solid ${c.border}; padding-top: 20px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.dim}; font-size: 10px; letter-spacing: 1px; line-height: 1.8; background-color: ${c.bg};" bgcolor="${c.bg}">
                    <span style="color: ${c.primary};">&#9632;</span> VIA H4KU.COM<br>
                    <span style="color: ${c.dim};">CLIENT: ${escapeHtml(clientIp)}</span>
                  </td>
                  <td align="right" valign="bottom" style="background-color: ${c.bg};" bgcolor="${c.bg}">
                    <a href="https://h4ku.com" style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.primary}; text-decoration: none; font-size: 11px; letter-spacing: 1px;">
                      h4ku.com &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom Border -->
          <tr>
            <td style="padding-top: 20px; border-bottom: 2px solid ${c.border}; background-color: ${c.bg};" bgcolor="${c.bg}"></td>
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
  const c = {
    primary: '#c0a88d',
    bg: '#1a1a1a',
    surface: '#0f0f0f',
    text: '#e5e2dd',
    muted: '#999999',
    dim: '#666666',
    border: '#333333',
  };

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <meta name="x-apple-disable-message-reformatting">
  <title>Message Received - H4KU.com</title>
  ${emailStyles}
</head>
<body class="body" style="margin: 0; padding: 0; width: 100%; background-color: ${c.bg}; -webkit-text-size-adjust: none; -ms-text-size-adjust: none;">
  <!-- Gmail dark mode fix wrapper -->
  <div class="gmail-fix" style="display: none; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; background-color: ${c.bg};">
    Your message has been received - h4ku.com
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="body" style="background-color: ${c.bg};" bgcolor="${c.bg}">
    <tr>
      <td align="center" style="padding: 32px 16px; background-color: ${c.bg};" bgcolor="${c.bg}">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" class="container" style="max-width: 560px; width: 100%; background-color: ${c.bg};" bgcolor="${c.bg}">

          <!-- Display Issue Notice -->
          <tr>
            <td align="center" style="padding-bottom: 16px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 10px; color: ${c.dim}; letter-spacing: 0.5px;">
                Email not displaying correctly? Try disabling dark mode.
              </span>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="border-top: 2px solid ${c.border}; padding: 24px 0; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.primary}; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-weight: bold; background-color: ${c.bg};" bgcolor="${c.bg}">
                    H4KU.COM
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding-bottom: 24px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.text}; font-size: 15px; line-height: 1.6;">
                Hi ${escapeHtml(payload.name)},
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding-bottom: 24px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="surface" style="background-color: ${c.surface}; border: 2px solid ${c.border};" bgcolor="${c.surface}">
                <tr>
                  <td style="padding: 24px; background-color: ${c.surface};" bgcolor="${c.surface}">
                    <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.text}; font-size: 14px; line-height: 1.8;">
                      <div style="margin-bottom: 16px;">
                        <span style="color: ${c.primary};">&#10003;</span>&nbsp; Your message has been received.
                      </div>
                      <div style="margin-bottom: 16px;">
                        I will get back to you within <strong style="color: ${c.primary};">3 business days</strong>.
                      </div>
                      <div style="color: ${c.muted}; font-size: 12px; border-left: 2px solid ${c.border}; padding-left: 12px;">
                        REF: ${escapeHtml(referenceId)}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Important Notice -->
          <tr>
            <td style="padding-bottom: 24px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.muted}; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; padding-bottom: 12px; background-color: ${c.bg};" bgcolor="${c.bg}">
                    Important
                  </td>
                </tr>
                <tr>
                  <td style="background-color: ${c.surface}; border-left: 2px solid ${c.primary}; padding: 16px 20px;" bgcolor="${c.surface}">
                    <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.text}; font-size: 13px; line-height: 1.8;">
                      <div style="margin-bottom: 12px;">
                        <span style="color: ${c.primary};">&#9632;</span>&nbsp; Please add <strong>@h4ku.com</strong> to your email whitelist to ensure you receive my reply.
                      </div>
                      <div style="color: ${c.muted};">
                        <span style="color: ${c.primary};">&#9632;</span>&nbsp; If you don't hear back within 3 business days, please check your spam folder.
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 2px solid ${c.border}; padding-top: 20px; background-color: ${c.bg};" bgcolor="${c.bg}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.dim}; font-size: 12px; line-height: 1.6; background-color: ${c.bg};" bgcolor="${c.bg}">
                    Best regards,<br>
                    <span style="color: ${c.primary};">HAKU</span>
                  </td>
                  <td align="right" valign="bottom" style="background-color: ${c.bg};" bgcolor="${c.bg}">
                    <a href="https://h4ku.com" style="font-family: 'SF Mono', Monaco, Consolas, monospace; color: ${c.primary}; text-decoration: none; font-size: 11px; letter-spacing: 1px;">
                      h4ku.com &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom Border -->
          <tr>
            <td style="padding-top: 20px; border-bottom: 2px solid ${c.border}; background-color: ${c.bg};" bgcolor="${c.bg}"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
  const notificationHtml = createEmailHtml(payload, referenceId, clientIp);
  const confirmationHtml = createConfirmationEmailHtml(payload, referenceId);

  try {
    // Send notification email to admin
    const notificationResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'HAKU <contact@h4ku.com>',
        to: [env.CONTACT_TO_EMAIL],
        reply_to: payload.email,
        subject: `[H4KU.com] Contact from ${payload.name}`,
        html: notificationHtml,
      }),
    });

    const notificationResult = await notificationResponse.json() as Record<string, unknown>;

    if (!notificationResponse.ok) {
      console.error('Resend error:', notificationResponse.status, JSON.stringify(notificationResult));
      return Response.json(
        {
          success: false,
          message: `Email service error: ${(notificationResult as { message?: string }).message || notificationResponse.status}`,
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Send confirmation email to user
    const confirmationResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'HAKU <contact@h4ku.com>',
        to: [payload.email],
        subject: `[H4KU.com] Message Received - ${referenceId}`,
        html: confirmationHtml,
      }),
    });

    if (!confirmationResponse.ok) {
      const confirmationResult = await confirmationResponse.json();
      console.error('Failed to send confirmation email:', JSON.stringify(confirmationResult));
      // Don't fail the request, just log the error
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
