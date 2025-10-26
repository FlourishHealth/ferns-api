import * as Sentry from "@sentry/node";
import axios from "axios";
import chai from "chai";

const assert: Chai.AssertStatic = chai.assert;

import {sendToGoogleChat, sendToSlack, sendToZoom} from "./expressServer";

describe("expressServer webhook helpers", () => {
  let mockAxiosPost: jest.SpyInstance;

  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    mockAxiosPost = jest.spyOn(axios, "post").mockResolvedValue({status: 200});
    process.env = {...ORIGINAL_ENV};
    delete process.env.SLACK_WEBHOOKS;
    delete process.env.GOOGLE_CHAT_WEBHOOKS;
    delete process.env.ZOOM_CHAT_WEBHOOKS;
    (Sentry.captureException as jest.Mock).mockClear();
    (Sentry.captureMessage as jest.Mock).mockClear();
  });

  afterEach(() => {
    mockAxiosPost.mockRestore();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("sendToSlack", () => {
    it("returns early when SLACK_WEBHOOKS is missing", async () => {
      await sendToSlack("hello");
      assert.equal(mockAxiosPost.mock.calls.length, 0);
    });

    it("posts to default webhook with plain text", async () => {
      process.env.SLACK_WEBHOOKS = JSON.stringify({default: "https://slack.example/webhook"});
      mockAxiosPost.mockResolvedValue({status: 200});

      await sendToSlack("hello world");
      assert.equal(mockAxiosPost.mock.calls.length, 1);
      const callArgs = mockAxiosPost.mock.calls[0];
      assert.isArray(callArgs);
      const [url, payload] = callArgs;
      assert.equal(url, "https://slack.example/webhook");
      assert.deepEqual(payload, {text: "hello world"});
    });

    it("posts to a specific channel when provided", async () => {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://slack.example/default",
        ops: "https://slack.example/ops",
      });
      mockAxiosPost.mockResolvedValue({status: 200});

      await sendToSlack("ops msg", {slackChannel: "ops"});
      const callArgs = mockAxiosPost.mock.calls[0];
      assert.isArray(callArgs);
      const [url, payload] = callArgs;
      assert.equal(url, "https://slack.example/ops");
      assert.deepEqual(payload, {text: "ops msg"});
    });

    it("falls back to default when channel not found", async () => {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://slack.example/default",
      });
      mockAxiosPost.mockResolvedValue({status: 200});

      await sendToSlack("missing channel", {slackChannel: "unknown"});
      const callArgs = mockAxiosPost.mock.calls[0];
      assert.isArray(callArgs);
      const [url, payload] = callArgs;
      assert.equal(url, "https://slack.example/default");
      assert.deepEqual(payload, {text: "missing channel"});
    });

    it("prefixes message with [ENV] when env provided", async () => {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://slack.example/default",
      });
      mockAxiosPost.mockResolvedValue({status: 200});

      await sendToSlack("status ok", {env: "stg"});
      const callArgs = mockAxiosPost.mock.calls[0];
      assert.isArray(callArgs);
      const [, payload] = callArgs;
      assert.deepEqual(payload, {text: "[STG] status ok"});
    });

    it("captures error and throws APIError when shouldThrow=true", async () => {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://slack.example/default",
      });
      mockAxiosPost.mockRejectedValue(new Error("slack down"));

      try {
        await sendToSlack("err", {shouldThrow: true});
        assert.fail("Expected sendToSlack to throw APIError");
      } catch (error) {
        assert.equal((error as any).name, "APIError");
        assert.match((error as any).title, /Error posting to slack/i);
      }
      assert.equal(mockAxiosPost.mock.calls.length, 1);
    });

    it("captures error and does not throw when shouldThrow=false", async () => {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://slack.example/default",
      });
      mockAxiosPost.mockRejectedValue(new Error("slack intermittent"));

      await sendToSlack("err", {shouldThrow: false});
      assert.equal(mockAxiosPost.mock.calls.length, 1);
    });
  });

  describe("sendToGoogleChat", () => {
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

  describe("sendToZoom", () => {
    it("returns early when ZOOM_CHAT_WEBHOOKS is missing", async () => {
      await sendToZoom("hello", {channel: "default"});
      assert.equal(mockAxiosPost.mock.calls.length, 0);
    });

    it("posts to default webhook with plain text and authorization header", async () => {
      process.env.ZOOM_CHAT_WEBHOOKS = JSON.stringify({
        default: {
          channel: "https://zoom.example/webhook",
          verificationToken: "test-token-123",
        },
      });
      mockAxiosPost.mockResolvedValue({status: 200});

      await sendToZoom("hello world", {channel: "default"});
      assert.equal(mockAxiosPost.mock.calls.length, 1);
      const callArgs = mockAxiosPost.mock.calls[0];
      assert.isArray(callArgs);
      const [url, payload, options] = callArgs;
      assert.equal(url, "https://zoom.example/webhook");
      assert.equal(payload, "hello world");
      assert.deepEqual(options.headers, {
        Authorization: "test-token-123",
        "Content-Type": "application/json",
      });
    });

    it("posts to a specific channel when provided", async () => {
      process.env.ZOOM_CHAT_WEBHOOKS = JSON.stringify({
        default: {
          channel: "https://zoom.example/default",
          verificationToken: "default-token",
        },
        ops: {
          channel: "https://zoom.example/ops",
          verificationToken: "ops-token",
        },
      });
      mockAxiosPost.mockResolvedValue({status: 200});

      await sendToZoom("ops msg", {channel: "ops"});
      const callArgs = mockAxiosPost.mock.calls[0];
      assert.isArray(callArgs);
      const [url, payload, options] = callArgs;
      assert.equal(url, "https://zoom.example/ops");
      assert.equal(payload, "ops msg");
      assert.equal(options.headers.Authorization, "ops-token");
    });

    it("falls back to default when channel not found", async () => {
      process.env.ZOOM_CHAT_WEBHOOKS = JSON.stringify({
        default: {
          channel: "https://zoom.example/default",
          verificationToken: "default-token",
        },
      });
      mockAxiosPost.mockResolvedValue({status: 200});

      await sendToZoom("missing channel", {channel: "unknown"});
      const callArgs = mockAxiosPost.mock.calls[0];
      assert.isArray(callArgs);
      const [url, payload] = callArgs;
      assert.equal(url, "https://zoom.example/default");
      assert.equal(payload, "missing channel");
    });

    it("returns early when webhook url is missing for channel", async () => {
      process.env.ZOOM_CHAT_WEBHOOKS = JSON.stringify({
        default: {
          verificationToken: "default-token",
        },
      });

      await sendToZoom("no url", {channel: "default"});
      assert.equal(mockAxiosPost.mock.calls.length, 0);
    });

    it("returns early when verification token is missing for channel", async () => {
      process.env.ZOOM_CHAT_WEBHOOKS = JSON.stringify({
        default: {
          channel: "https://zoom.example/default",
        },
      });

      await sendToZoom("no token", {channel: "default"});
      assert.equal(mockAxiosPost.mock.calls.length, 0);
    });

    it("prefixes message with [ENV] when env provided", async () => {
      process.env.ZOOM_CHAT_WEBHOOKS = JSON.stringify({
        default: {
          channel: "https://zoom.example/default",
          verificationToken: "token",
        },
      });
      mockAxiosPost.mockResolvedValue({status: 200});

      await sendToZoom("status ok", {channel: "default", env: "stg"});
      const callArgs = mockAxiosPost.mock.calls[0];
      assert.isArray(callArgs);
      const [, payload] = callArgs;
      assert.equal(payload, "[STG] status ok");
    });

    it("captures error and throws APIError when shouldThrow=true", async () => {
      process.env.ZOOM_CHAT_WEBHOOKS = JSON.stringify({
        default: {
          channel: "https://zoom.example/default",
          verificationToken: "token",
        },
      });
      mockAxiosPost.mockRejectedValue(new Error("zoom down"));

      try {
        await sendToZoom("err", {channel: "default", shouldThrow: true});
        assert.fail("Expected sendToZoom to throw APIError");
      } catch (error) {
        assert.equal((error as any).name, "APIError");
        assert.match((error as any).title, /Error posting to Zoom/i);
      }
      assert.equal(mockAxiosPost.mock.calls.length, 1);
    });

    it("captures error and does not throw when shouldThrow=false", async () => {
      process.env.ZOOM_CHAT_WEBHOOKS = JSON.stringify({
        default: {
          channel: "https://zoom.example/default",
          verificationToken: "token",
        },
      });
      mockAxiosPost.mockRejectedValue(new Error("zoom intermittent"));

      await sendToZoom("err", {channel: "default", shouldThrow: false});
      assert.equal(mockAxiosPost.mock.calls.length, 1);
    });
  });
});
