import * as Sentry from "@sentry/node";
import axios from "axios";

import {APIError} from "../errors";
import {logger} from "../logger";

/**
 * Sends a message to a Zoom chat channel via webhook.
 *
 * @param messageText - The message text to send
 * @param options - Configuration options
 * @param options.channel - The Zoom channel to post to (defaults to "default")
 * @param options.shouldThrow - If true, throws an APIError on failure; otherwise logs and continues
 * @param options.env - Optional environment prefix (e.g., "stg", "prod") to prepend to message
 *
 * @remarks
 * Requires ZOOM_CHAT_WEBHOOKS environment variable containing JSON with channel configurations:
 * ```json
 * {
 *   "default": {"channel": "webhook_url", "verificationToken": "token"},
 *   "ops": {"channel": "webhook_url", "verificationToken": "token"}
 * }
 * ```
 *
 * Falls back to "default" channel if specified channel not found.
 * Logs errors to Sentry and logger when webhook is missing or request fails.
 */
export async function sendToZoom(
  messageText: string | Record<string, string>,
  {channel, shouldThrow = false, env}: {channel: string; shouldThrow?: boolean; env?: string}
) {
  const zoomWebhooksString = process.env.ZOOM_CHAT_WEBHOOKS;
  if (!zoomWebhooksString) {
    const msg = `ZOOM_CHAT_WEBHOOKS not set. Zoom message not sent`;
    Sentry.captureException(new Error(msg));
    logger.error(msg);
    return;
  }
  const zoomWebhooks: Record<string, {channel: string; verificationToken: string}> = JSON.parse(
    zoomWebhooksString ?? "{}"
  );

  const zoomChannel = channel ?? "default";
  const zoomWebhookUrl = zoomWebhooks[zoomChannel]?.channel ?? zoomWebhooks.default?.channel;

  if (!zoomWebhookUrl) {
    const msg = `No webhook url set in env for ${zoomChannel}. Zoom message not sent`;
    Sentry.captureException(new Error(msg));
    logger.error(msg);
    return;
  }

  const zoomToken =
    zoomWebhooks[zoomChannel]?.verificationToken ?? zoomWebhooks.default?.verificationToken;
  if (!zoomToken) {
    const msg = `No verification token set in env for ${zoomChannel}. Zoom message not sent`;
    Sentry.captureException(new Error(msg));
    logger.error(msg);
    return;
  }

  if (env) {
    messageText = `[${env.toUpperCase()}] ${messageText}`;
  }

  try {
    await axios.post(zoomWebhookUrl, messageText, {
      headers: {
        Authorization: zoomToken,
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    logger.error(`Error posting to Zoom: ${error.text ?? error.message}`);
    Sentry.captureException(error);
    if (shouldThrow) {
      throw new APIError({
        status: 500,
        title: `Error posting to Zoom: ${error.text ?? error.message}`,
      });
    }
  }
}
