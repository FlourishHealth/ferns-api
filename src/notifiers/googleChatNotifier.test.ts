import * as Sentry from "@sentry/node";
import axios from "axios";
import chai from "chai";

const assert: Chai.AssertStatic = chai.assert;

import {sendToGoogleChat} from "./googleChatNotifier";

describe("sendToGoogleChat", () => {
  let mockAxiosPost: jest.SpyInstance;

  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    mockAxiosPost = jest.spyOn(axios, "post").mockResolvedValue({status: 200});
    process.env = {...ORIGINAL_ENV};
    process.env.GOOGLE_CHAT_WEBHOOKS = undefined;
    (Sentry.captureException as jest.Mock).mockClear();
    (Sentry.captureMessage as jest.Mock).mockClear();
  });

  afterEach(() => {
    mockAxiosPost.mockRestore();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns early when GOOGLE_CHAT_WEBHOOKS is missing", async () => {
    await sendToGoogleChat("hello");
    assert.equal(mockAxiosPost.mock.calls.length, 0);
  });

  it("posts to default webhook with plain text", async () => {
    process.env.GOOGLE_CHAT_WEBHOOKS = JSON.stringify({
      default: "https://chat.example/webhook",
    });
    mockAxiosPost.mockResolvedValue({status: 200});

    await sendToGoogleChat("hello world");
    const callArgs = mockAxiosPost.mock.calls[0];
    assert.isArray(callArgs);
    const [url, payload] = callArgs;
    assert.equal(url, "https://chat.example/webhook");
    assert.deepEqual(payload, {text: "hello world"});
  });

  it("posts to a specific channel when provided", async () => {
    process.env.GOOGLE_CHAT_WEBHOOKS = JSON.stringify({
      default: "https://chat.example/default",
      ops: "https://chat.example/ops",
    });
    mockAxiosPost.mockResolvedValue({status: 200});

    await sendToGoogleChat("ops msg", {channel: "ops"});
    const callArgs = mockAxiosPost.mock.calls[0];
    assert.isArray(callArgs);
    const [url, payload] = callArgs;
    assert.equal(url, "https://chat.example/ops");
    assert.deepEqual(payload, {text: "ops msg"});
  });

  it("falls back to default when channel not found", async () => {
    process.env.GOOGLE_CHAT_WEBHOOKS = JSON.stringify({
      default: "https://chat.example/default",
    });
    mockAxiosPost.mockResolvedValue({status: 200});

    await sendToGoogleChat("missing channel", {channel: "unknown"});
    const callArgs = mockAxiosPost.mock.calls[0];
    assert.isArray(callArgs);
    const [url, payload] = callArgs;
    assert.equal(url, "https://chat.example/default");
    assert.deepEqual(payload, {text: "missing channel"});
  });

  it("prefixes message with [ENV] when env provided", async () => {
    process.env.GOOGLE_CHAT_WEBHOOKS = JSON.stringify({
      default: "https://chat.example/default",
    });
    mockAxiosPost.mockResolvedValue({status: 200});

    await sendToGoogleChat("status ok", {env: "prod"});
    const callArgs = mockAxiosPost.mock.calls[0];
    assert.isArray(callArgs);
    const [, payload] = callArgs;
    assert.deepEqual(payload, {text: "[PROD] status ok"});
  });

  it("captures error and throws APIError when shouldThrow=true", async () => {
    process.env.GOOGLE_CHAT_WEBHOOKS = JSON.stringify({
      default: "https://chat.example/default",
    });
    mockAxiosPost.mockRejectedValue(new Error("chat down"));

    try {
      await sendToGoogleChat("err", {shouldThrow: true});
      assert.fail("Expected sendToGoogleChat to throw APIError");
    } catch (error) {
      assert.equal((error as any).name, "APIError");
      assert.match((error as any).title, /Error posting to Google Chat/i);
    }
    assert.equal(mockAxiosPost.mock.calls.length, 1);
  });

  it("captures error and does not throw when shouldThrow=false", async () => {
    process.env.GOOGLE_CHAT_WEBHOOKS = JSON.stringify({
      default: "https://chat.example/default",
    });
    mockAxiosPost.mockRejectedValue(new Error("chat intermittent"));

    await sendToGoogleChat("err", {shouldThrow: false});
    assert.equal(mockAxiosPost.mock.calls.length, 1);
  });
});
