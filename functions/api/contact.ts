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
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: 'Courier New', Courier, monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">

          <!-- Top Border Line -->
          <tr>
            <td style="border-top: 1px solid #333; padding-top: 30px;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color: #689696; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">
                      H4KU.COM
                    </span>
                  </td>
                  <td align="right">
                    <span style="color: #666; font-size: 11px;">
                      ${dateStr}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom: 30px;">
              <div style="color: #e8e8e8; font-size: 20px; font-weight: normal; letter-spacing: 1px;">
                New Message
              </div>
              <div style="color: #666; font-size: 12px; margin-top: 8px;">
                ref: ${escapeHtml(referenceId)}
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-top: 1px solid #333; padding-top: 30px;"></td>
          </tr>

          <!-- Sender Section -->
          <tr>
            <td style="padding-bottom: 25px;">
              <div style="color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                From
              </div>
              <div style="color: #e8e8e8; font-size: 16px;">
                ${escapeHtml(payload.name)}
              </div>
              <div style="margin-top: 4px;">
                <a href="mailto:${escapeHtml(payload.email)}" style="color: #689696; text-decoration: none; font-size: 13px;">
                  ${escapeHtml(payload.email)}
                </a>
              </div>
            </td>
          </tr>

          <!-- Message Section -->
          <tr>
            <td style="padding-bottom: 30px;">
              <div style="color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">
                Message
              </div>
              <div style="background-color: #0f0f0f; border-left: 2px solid #689696; padding: 20px; color: #ccc; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(payload.message)}</div>
            </td>
          </tr>

          <!-- Bottom Divider -->
          <tr>
            <td style="border-top: 1px solid #333; padding-top: 25px;"></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: #666; font-size: 11px; line-height: 1.6;">
                    <span style="color: #e87722;">●</span> Transmitted via h4ku.com<br>
                    <span style="color: #444;">Client: ${escapeHtml(clientIp)}</span>
                  </td>
                  <td align="right" valign="bottom">
                    <a href="https://h4ku.com" style="color: #689696; text-decoration: none; font-size: 11px;">
                      h4ku.com →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom Border Line -->
          <tr>
            <td style="padding-top: 30px; border-bottom: 1px solid #333;"></td>
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
  const html = createEmailHtml(payload, referenceId, clientIp);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'HAKU <0x@h4ku.com>',
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
