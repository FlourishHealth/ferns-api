import * as Sentry from "@sentry/node";
import axios from "axios";
import chai from "chai";

import {APIError} from "./errors";
import {sendToGoogleChat, sendToSlack} from "./expressServer";

const assert: Chai.AssertStatic = chai.assert;

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock("@sentry/node", () => {
  const originalModule = jest.requireActual("@sentry/node");
  return {
    ...originalModule,
    captureMessage: jest.fn(),
    captureException: jest.fn(),
    isInitialized: jest.fn(() => true),
  };
});

describe("expressServer webhook helpers", () => {
  const mockedAxios = axios as unknown as {post: jest.Mock};

  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    mockedAxios.post.mockReset();
    jest.resetModules();
    process.env = {...ORIGINAL_ENV};
    delete process.env.SLACK_WEBHOOKS;
    delete process.env.GOOGLE_CHAT_WEBHOOKS;
    (Sentry.captureException as jest.Mock).mockReset();
    (Sentry.captureMessage as jest.Mock).mockReset();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("sendToSlack", () => {
    it("returns early when SLACK_WEBHOOKS is missing", async () => {
      await sendToSlack("hello");
      assert.equal(mockedAxios.post.mock.calls.length, 0);
    });

    it("posts to default webhook with plain text", async () => {
      process.env.SLACK_WEBHOOKS = JSON.stringify({default: "https://slack.example/webhook"});
      mockedAxios.post.mockResolvedValue({status: 200});

      await sendToSlack("hello world");
      assert.equal(mockedAxios.post.mock.calls.length, 1);
      const [url, payload] = mockedAxios.post.mock.calls[0];
      assert.equal(url, "https://slack.example/webhook");
      assert.deepEqual(payload, {text: "hello world"});
    });

    it("posts to a specific channel when provided", async () => {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://slack.example/default",
        ops: "https://slack.example/ops",
      });
      mockedAxios.post.mockResolvedValue({status: 200});

      await sendToSlack("ops msg", {slackChannel: "ops"});
      const [url, payload] = mockedAxios.post.mock.calls[0];
      assert.equal(url, "https://slack.example/ops");
      assert.deepEqual(payload, {text: "ops msg"});
    });

    it("falls back to default when channel not found", async () => {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://slack.example/default",
      });
      mockedAxios.post.mockResolvedValue({status: 200});

      await sendToSlack("missing channel", {slackChannel: "unknown"});
      const [url, payload] = mockedAxios.post.mock.calls[0];
      assert.equal(url, "https://slack.example/default");
      assert.deepEqual(payload, {text: "missing channel"});
    });

    it("prefixes message with [ENV] when env provided", async () => {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://slack.example/default",
      });
      mockedAxios.post.mockResolvedValue({status: 200});

      await sendToSlack("status ok", {env: "stg"});
      const [, payload] = mockedAxios.post.mock.calls[0];
      assert.deepEqual(payload, {text: "[STG] status ok"});
    });

    it("captures error and throws APIError when shouldThrow=true", async () => {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://slack.example/default",
      });
      mockedAxios.post.mockRejectedValue(new Error("slack down"));

      let threw = false;
      try {
        await sendToSlack("err", {shouldThrow: true});
      } catch (error) {
        threw = true;
        assert.instanceOf(error as any, APIError);
        assert.match((error as any).title, /Error posting to slack/i);
      }
      assert.isTrue(threw);
      assert.equal(mockedAxios.post.mock.calls.length, 1);
      assert.equal((Sentry.captureException as jest.Mock).mock.calls.length, 1);
    });

    it("captures error and does not throw when shouldThrow=false", async () => {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://slack.example/default",
      });
      mockedAxios.post.mockRejectedValue(new Error("slack intermittent"));

      await sendToSlack("err", {shouldThrow: false});
      assert.equal(mockedAxios.post.mock.calls.length, 1);
      assert.equal((Sentry.captureException as jest.Mock).mock.calls.length, 1);
    });
  });

  describe("sendToGoogleChat", () => {
    it("returns early when GOOGLE_CHAT_WEBHOOKS is missing", async () => {
      await sendToGoogleChat("hello");
      assert.equal(mockedAxios.post.mock.calls.length, 0);
    });

    it("posts to default webhook with plain text", async () => {
      process.env.GOOGLE_CHAT_WEBHOOKS = JSON.stringify({
        default: "https://chat.example/webhook",
      });
      mockedAxios.post.mockResolvedValue({status: 200});

      await sendToGoogleChat("hello world");
      const [url, payload] = mockedAxios.post.mock.calls[0];
      assert.equal(url, "https://chat.example/webhook");
      assert.deepEqual(payload, {text: "hello world"});
    });

    it("posts to a specific channel when provided", async () => {
      process.env.GOOGLE_CHAT_WEBHOOKS = JSON.stringify({
        default: "https://chat.example/default",
        ops: "https://chat.example/ops",
      });
      mockedAxios.post.mockResolvedValue({status: 200});

      await sendToGoogleChat("ops msg", {slackChannel: "ops"});
      const [url, payload] = mockedAxios.post.mock.calls[0];
      assert.equal(url, "https://chat.example/ops");
      assert.deepEqual(payload, {text: "ops msg"});
    });

    it("falls back to default when channel not found", async () => {
      process.env.GOOGLE_CHAT_WEBHOOKS = JSON.stringify({
        default: "https://chat.example/default",
      });
      mockedAxios.post.mockResolvedValue({status: 200});

      await sendToGoogleChat("missing channel", {slackChannel: "unknown"});
      const [url, payload] = mockedAxios.post.mock.calls[0];
      assert.equal(url, "https://chat.example/default");
      assert.deepEqual(payload, {text: "missing channel"});
    });

    it("prefixes message with [ENV] when env provided", async () => {
      process.env.GOOGLE_CHAT_WEBHOOKS = JSON.stringify({
        default: "https://chat.example/default",
      });
      mockedAxios.post.mockResolvedValue({status: 200});

      await sendToGoogleChat("status ok", {env: "prod"});
      const [, payload] = mockedAxios.post.mock.calls[0];
      assert.deepEqual(payload, {text: "[PROD] status ok"});
    });

    it("captures error and throws APIError when shouldThrow=true", async () => {
      process.env.GOOGLE_CHAT_WEBHOOKS = JSON.stringify({
        default: "https://chat.example/default",
      });
      mockedAxios.post.mockRejectedValue(new Error("chat down"));

      let threw = false;
      try {
        await sendToGoogleChat("err", {shouldThrow: true});
      } catch (error) {
        threw = true;
        assert.instanceOf(error as any, APIError);
        assert.match((error as any).title, /Error posting to Google Chat/i);
      }
      assert.isTrue(threw);
      assert.equal((Sentry.captureException as jest.Mock).mock.calls.length, 1);
    });

    it("captures error and does not throw when shouldThrow=false", async () => {
      process.env.GOOGLE_CHAT_WEBHOOKS = JSON.stringify({
        default: "https://chat.example/default",
      });
      mockedAxios.post.mockRejectedValue(new Error("chat intermittent"));

      await sendToGoogleChat("err", {shouldThrow: false});
      assert.equal(mockedAxios.post.mock.calls.length, 1);
      assert.equal((Sentry.captureException as jest.Mock).mock.calls.length, 1);
    });
  });
});
