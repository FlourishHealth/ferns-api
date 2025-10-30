import * as Sentry from "@sentry/node";
import axios from "axios";
import chai from "chai";

const assert: Chai.AssertStatic = chai.assert;

import {sendToZoom} from "./zoomNotifier";

describe("sendToZoom", () => {
  let mockAxiosPost: jest.SpyInstance;

  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    mockAxiosPost = jest.spyOn(axios, "post").mockResolvedValue({status: 200});
    process.env = {...ORIGINAL_ENV};
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

  it("returns early when ZOOM_CHAT_WEBHOOKS is missing", async () => {
    await sendToZoom({header: "hello", body: "world"}, {channel: "default"});
    assert.equal(mockAxiosPost.mock.calls.length, 0);
  });

  it("posts to default webhook with rich message format and authorization header", async () => {
    process.env.ZOOM_CHAT_WEBHOOKS = JSON.stringify({
      default: {
        channel: "https://zoom.example/webhook",
        verificationToken: "test-token-123",
      },
    });
    mockAxiosPost.mockResolvedValue({status: 200});

    await sendToZoom({header: "hello", body: "world"}, {channel: "default"});
    assert.equal(mockAxiosPost.mock.calls.length, 1);
    const callArgs = mockAxiosPost.mock.calls[0];
    assert.isArray(callArgs);
    const [url, payload, options] = callArgs;
    assert.equal(url, "https://zoom.example/webhook?format=full");
    assert.deepEqual(payload, {
      content: {
        head: {text: "hello"},
        body: [{type: "message", text: "world"}],
      },
    });
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

    await sendToZoom({header: "ops msg", body: "ops msg"}, {channel: "ops"});
    const callArgs = mockAxiosPost.mock.calls[0];
    assert.isArray(callArgs);
    const [url, payload, options] = callArgs;
    assert.equal(url, "https://zoom.example/ops?format=full");
    assert.deepEqual(payload, {
      content: {
        head: {text: "ops msg"},
        body: [{type: "message", text: "ops msg"}],
      },
    });
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

    await sendToZoom({header: "missing channel", body: "missing channel"}, {channel: "unknown"});
    const callArgs = mockAxiosPost.mock.calls[0];
    assert.isArray(callArgs);
    const [url, payload] = callArgs;
    assert.equal(url, "https://zoom.example/default?format=full");
    assert.deepEqual(payload, {
      content: {
        head: {text: "missing channel"},
        body: [{type: "message", text: "missing channel"}],
      },
    });
  });

  it("returns early when webhook url is missing for channel", async () => {
    process.env.ZOOM_CHAT_WEBHOOKS = JSON.stringify({
      default: {
        verificationToken: "default-token",
      },
    });

    await sendToZoom({header: "no url", body: "no url"}, {channel: "default"});
    assert.equal(mockAxiosPost.mock.calls.length, 0);
  });

  it("returns early when verification token is missing for channel", async () => {
    process.env.ZOOM_CHAT_WEBHOOKS = JSON.stringify({
      default: {
        channel: "https://zoom.example/default",
      },
    });

    await sendToZoom({header: "no token", body: "no token"}, {channel: "default"});
    assert.equal(mockAxiosPost.mock.calls.length, 0);
  });

  it("prefixes header with [ENV] when env provided", async () => {
    process.env.ZOOM_CHAT_WEBHOOKS = JSON.stringify({
      default: {
        channel: "https://zoom.example/default",
        verificationToken: "token",
      },
    });
    mockAxiosPost.mockResolvedValue({status: 200});

    await sendToZoom({header: "status ok", body: "status ok"}, {channel: "default", env: "stg"});
    const callArgs = mockAxiosPost.mock.calls[0];
    assert.isArray(callArgs);
    const [, payload] = callArgs;
    assert.deepEqual(payload, {
      content: {
        head: {text: "[STG] status ok"},
        body: [{type: "message", text: "status ok"}],
      },
    });
  });

  it("includes subheader when provided", async () => {
    process.env.ZOOM_CHAT_WEBHOOKS = JSON.stringify({
      default: {
        channel: "https://zoom.example/default",
        verificationToken: "token",
      },
    });
    mockAxiosPost.mockResolvedValue({status: 200});

    await sendToZoom(
      {header: "Main Header", body: "Body text", subheader: "Subheader text"},
      {channel: "default"}
    );
    const callArgs = mockAxiosPost.mock.calls[0];
    assert.isArray(callArgs);
    const [, payload] = callArgs;
    assert.deepEqual(payload, {
      content: {
        head: {text: "Main Header", sub_head: {text: "Subheader text"}},
        body: [{type: "message", text: "Body text"}],
      },
    });
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
      await sendToZoom({header: "err", body: "err"}, {channel: "default", shouldThrow: true});
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

    await sendToZoom({header: "err", body: "err"}, {channel: "default", shouldThrow: false});
    assert.equal(mockAxiosPost.mock.calls.length, 1);
  });
});

