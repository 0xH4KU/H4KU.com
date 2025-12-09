/**
 * Cloudflare Pages Function - Contact Form Handler (Discord Webhook)
 *
 * Sends contact form submissions to a Discord channel via webhook.
 * Simplest setup - just create a webhook URL in Discord!
 *
 * Required environment variables:
 * - DISCORD_WEBHOOK_URL: Discord webhook URL
 */

interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

interface Env {
  DISCORD_WEBHOOK_URL: string;
}

function generateReferenceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `HAKU-${timestamp}-${random}`.toUpperCase();
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://h4ku.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
  };

  if (!env.DISCORD_WEBHOOK_URL) {
    console.error('Missing DISCORD_WEBHOOK_URL');
    return Response.json(
      { success: false, message: 'Server configuration error' },
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
  const timestamp = new Date().toISOString();

  // Discord embed message
  const discordPayload = {
    username: 'H4KU.com Contact',
    avatar_url: 'https://h4ku.com/favicon.ico',
    embeds: [
      {
        title: '📬 New Contact Form Submission',
        color: 0x00ff00, // Green
        fields: [
          {
            name: '🔖 Reference ID',
            value: `\`${referenceId}\``,
            inline: true,
          },
          {
            name: '👤 Name',
            value: payload.name,
            inline: true,
          },
          {
            name: '📧 Email',
            value: payload.email,
            inline: true,
          },
          {
            name: '💬 Message',
            value:
              payload.message.length > 1000
                ? payload.message.substring(0, 1000) + '...'
                : payload.message,
            inline: false,
          },
        ],
        footer: {
          text: `IP: ${clientIp}`,
        },
        timestamp: timestamp,
      },
    ],
  };

  try {
    const response = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) {
      console.error('Discord webhook error:', response.status);
      throw new Error(`Discord returned ${response.status}`);
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
    console.error('Failed to send to Discord:', error);
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
