/**
 * Cloudflare Pages Function - Contact Form Handler (Discord Webhook)
 *
 * Sends contact form submissions to a Discord channel via webhook.
 * Simplest setup - just create a webhook URL in Discord!
 *
 * Required environment variables:
 * - DISCORD_WEBHOOK_URL: Discord webhook URL
 * - TURNSTILE_SECRET_KEY: Cloudflare Turnstile secret key
 */

import {
  verifyTurnstile,
  checkBodySize,
  corsPreflightResponse,
  errorResponse,
  successResponse,
  fetchWithTimeout,
  generateSecureReferenceId,
  validateContactPayload,
  maskEmail,
  API_TIMEOUT_MS,
  type MiddlewareEnv,
} from './_middleware';
import { APP_ORIGIN } from '../../src/config/domains';

interface Env extends MiddlewareEnv {
  DISCORD_WEBHOOK_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Check body size before reading
  const bodySizeError = checkBodySize(request);
  if (bodySizeError) {
    return errorResponse(request, bodySizeError, 413);
  }

  if (!env.DISCORD_WEBHOOK_URL) {
    console.error('Missing DISCORD_WEBHOOK_URL');
    return errorResponse(request, 'Server configuration error', 500);
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
    return errorResponse(request, turnstileResult.error || 'Verification failed', 403);
  }

  const referenceId = generateSecureReferenceId();
  const timestamp = new Date().toISOString();

  // Discord embed message
  const discordPayload = {
    username: 'H4KU.COM Contact',
    avatar_url: `${APP_ORIGIN}/favicon.ico`,
    embeds: [
      {
        title: 'New Contact Form Submission',
        color: 0x00ff00, // Green
        fields: [
          {
            name: 'Reference ID',
            value: `\`${referenceId}\``,
            inline: true,
          },
          {
            name: 'Name',
            value: payload.name,
            inline: true,
          },
          {
            name: 'Email',
            value: payload.email,
            inline: true,
          },
          {
            name: 'Message',
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
    const response = await fetchWithTimeout(
      env.DISCORD_WEBHOOK_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
      },
      API_TIMEOUT_MS
    );

    if (!response.ok) {
      console.error('Discord webhook error:', response.status);
      throw new Error(`Discord returned ${response.status}`);
    }

    // Log with masked email
    console.log(`Contact form submitted: ${referenceId} from ${maskEmail(payload.email)}`);

    return successResponse(request, {
      message: 'Message sent successfully',
      referenceId,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Discord webhook timeout');
      return errorResponse(request, 'Service timeout. Please try again.', 504);
    }
    console.error('Failed to send to Discord:', error);
    return errorResponse(request, 'Failed to send message. Please try again later.', 500);
  }
};

export const onRequestOptions: PagesFunction = async (context) => {
  return corsPreflightResponse(context.request);
};
