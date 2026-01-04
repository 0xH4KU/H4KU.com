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

  // Brand colors matching h4ku.com
  const colors = {
    primary: '#c0a88d', // Chino - brand color
    background: '#1a1a1a',
    surface: '#0f0f0f',
    text: '#e5e2dd', // Wan White
    textMuted: '#999',
    textDim: '#666',
    border: '#333',
  };

  return `
·
`.trim();
}

function createConfirmationEmailHtml(
  payload: ContactPayload,
  referenceId: string
): string {
  const colors = {
    primary: '#c0a88d',
    background: '#1a1a1a',
    surface: '#0f0f0f',
    text: '#e5e2dd',
    textMuted: '#999',
    textDim: '#666',
    border: '#333',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Courier New', monospace;">
  <div style="display: none; max-height: 0; overflow: hidden;">Your message has been received - h4ku.com</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background}; padding: 32px 16px;" bgcolor="${colors.background}">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="border-top: 2px solid ${colors.border}; padding: 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: ${colors.primary}; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-weight: bold;">
                    H4KU.COM
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="color: ${colors.text}; font-size: 15px; line-height: 1.6;">
                Hi ${escapeHtml(payload.name)},
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.surface}; border: 2px solid ${colors.border};" bgcolor="${colors.surface}">
                <tr>
                  <td style="padding: 24px;">
                    <div style="color: ${colors.text}; font-size: 14px; line-height: 1.8;">
                      <div style="margin-bottom: 16px;">
                        <span style="color: ${colors.primary};">&#10003;</span>&nbsp; Your message has been received.
                      </div>
                      <div style="margin-bottom: 16px;">
                        I will get back to you within <strong style="color: ${colors.primary};">3 business days</strong>.
                      </div>
                      <div style="color: ${colors.textMuted}; font-size: 12px; border-left: 2px solid ${colors.border}; padding-left: 12px;">
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
            <td style="padding-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: ${colors.textMuted}; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; padding-bottom: 12px;">
                    Important
                  </td>
                </tr>
                <tr>
                  <td style="background-color: ${colors.surface}; border-left: 2px solid ${colors.primary}; padding: 16px 20px;" bgcolor="${colors.surface}">
                    <div style="color: ${colors.text}; font-size: 13px; line-height: 1.8;">
                      <div style="margin-bottom: 12px;">
                        <span style="color: ${colors.primary};">&#9632;</span>&nbsp; Please add <strong>@h4ku.com</strong> to your email whitelist to ensure you receive my reply.
                      </div>
                      <div style="color: ${colors.textMuted};">
                        <span style="color: ${colors.primary};">&#9632;</span>&nbsp; If you don't hear back within 3 business days, please check your spam folder.
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 2px solid ${colors.border}; padding-top: 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: ${colors.textDim}; font-size: 12px; line-height: 1.6;">
                    Best regards,<br>
                    <span style="color: ${colors.primary};">HAKU</span>
                  </td>
                  <td align="right" valign="bottom">
                    <a href="https://h4ku.com" style="color: ${colors.primary}; text-decoration: none; font-size: 11px; letter-spacing: 1px;">
                      h4ku.com &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom Border -->
          <tr>
            <td style="padding-top: 20px; border-bottom: 2px solid ${colors.border};"></td>
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
