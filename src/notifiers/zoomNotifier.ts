import * as Sentry from "@sentry/node";
import axios from "axios";

import {APIError} from "../errors";
import {logger} from "../logger";

/**
 * Sends a rich formatted message to a Zoom chat channel via webhook.
 *
 * @param message - Message content with header, body, and optional subheader
 * @param message.header - Main header text for the message
 * @param message.body - Body text content
 * @param message.subheader - Optional subheader text displayed below the main header
 * @param options - Configuration options
 * @param options.channel - The Zoom channel to post to (defaults to "default")
 * @param options.shouldThrow - If true, throws an APIError on failure; otherwise logs and continues
 * @param options.env - Optional environment prefix (e.g., "stg", "prod") prepended to header
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
 * Uses Zoom's rich message format (format=full) with structured header and body.
 */
export async function sendToZoom(
  {header, body, subheader}: {header: string; body: string; subheader?: string},
  {channel, shouldThrow = false, env}: {channel: string; shouldThrow?: boolean; env?: string}
) {
  const zoomWebhooksString = process.env.ZOOM_CHAT_WEBHOOKS;
  if (!zoomWebhooksString) {
    const msg = "ZOOM_CHAT_WEBHOOKS not set. Zoom message not sent";
    Sentry.captureException(new Error(msg));
    logger.error(msg);
    return;
  }
  const zoomWebhooks: Record<string, {channel: string; verificationToken: string}> = JSON.parse(
    zoomWebhooksString ?? "{}"
  );

  const zoomChannel = channel ?? "default";
  // Use format full
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

  // Build the message structure
  const messageBody: {
    head: {text: string; sub_head?: {text: string}};
    body: Array<{type: string; text: string}>;
  } = {
    head: {
      text: env ? `[${env.toUpperCase()}] ${header}` : header,
    },
    body: [
      {
        type: "message",
        text: body,
      },
    ],
  };

  // Add subheader if provided
  if (subheader) {
    messageBody.head.sub_head = {
      text: subheader,
    };
  }

  try {
    await axios.post(
      `${zoomWebhookUrl}?format=full`,
      {content: messageBody},
      {
        headers: {
          Authorization: zoomToken,
          "Content-Type": "application/json",
        },
      }
    );
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
