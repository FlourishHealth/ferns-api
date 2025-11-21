import * as Sentry from "@sentry/node";
import axios from "axios";

import {APIError} from "../errors";
import {logger} from "../logger";

export async function sendToGoogleChat(
  messageText: string,
  {channel, shouldThrow = false, env}: {channel?: string; shouldThrow?: boolean; env?: string} = {}
) {
  const chatWebhooksString = process.env.GOOGLE_CHAT_WEBHOOKS;
  if (!chatWebhooksString) {
    const msg = "GOOGLE_CHAT_WEBHOOKS not set. Google Chat message not sent";
    Sentry.captureException(new Error(msg));
    logger.error(msg);
    return;
  }
  const chatWebhooks = JSON.parse(chatWebhooksString ?? "{}");

  const chatChannel = channel ?? "default";
  const chatWebhookUrl = chatWebhooks[chatChannel] ?? chatWebhooks.default;

  if (!chatWebhookUrl) {
    const msg = `No webhook url set in env for ${chatChannel}. Google Chat message not sent`;
    Sentry.captureException(new Error(msg));
    logger.error(msg);
    return;
  }

  let formattedMessageText = messageText;
  if (env) {
    formattedMessageText = `[${env.toUpperCase()}] ${messageText}`;
  }

  try {
    await axios.post(chatWebhookUrl, {text: formattedMessageText});
  } catch (error: any) {
    logger.error(`Error posting to Google Chat: ${error.text ?? error.message}`);
    Sentry.captureException(error);
    if (shouldThrow) {
      throw new APIError({
        status: 500,
        title: `Error posting to Google Chat: ${error.text ?? error.message}`,
      });
    }
  }
}
