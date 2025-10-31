import * as Sentry from "@sentry/node";
import axios from "axios";
import chai from "chai";

const assert: Chai.AssertStatic = chai.assert;

import {sendToSlack} from "./slackNotifier";

describe("sendToSlack", () => {
  let mockAxiosPost: jest.SpyInstance;

  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    mockAxiosPost = jest.spyOn(axios, "post").mockResolvedValue({status: 200});
    process.env = {...ORIGINAL_ENV};
    delete process.env.SLACK_WEBHOOKS;
    (Sentry.captureException as jest.Mock).mockClear();
    (Sentry.captureMessage as jest.Mock).mockClear();
  });

  afterEach(() => {
    mockAxiosPost.mockRestore();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

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
