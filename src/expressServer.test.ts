import axios from "axios";
import {assert} from "chai";
import sinon from "sinon";

// Mock Sentry
jest.mock("@sentry/node", () => ({
  captureException: jest.fn(),
}));
import * as Sentry from "@sentry/node";

import {sendToSlack} from "./expressServer";
import {logger} from "./logger";

describe("expressServer", function () {
  describe("sendToSlack", function () {
    let originalEnv: NodeJS.ProcessEnv;
    let axiosPostStub: sinon.SinonStub;
    let loggerDebugStub: sinon.SinonStub;
    let loggerErrorStub: sinon.SinonStub;
    beforeEach(function () {
      originalEnv = process.env;
      process.env = {...originalEnv};

      axiosPostStub = sinon.stub(axios, "post").resolves();
      loggerDebugStub = sinon.stub(logger, "debug");
      loggerErrorStub = sinon.stub(logger, "error");

      // Reset mock before each test
      jest.clearAllMocks();
    });

    afterEach(function () {
      process.env = originalEnv;
      axiosPostStub.restore();
      loggerDebugStub.restore();
      loggerErrorStub.restore();
    });

    it("should send a message to the specified channel", async function () {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        test: "https://hooks.slack.com/services/test",
        default: "https://hooks.slack.com/services/default",
      });

      await sendToSlack("Test message", {slackChannel: "test"});

      assert.isTrue(axiosPostStub.calledOnce);
      assert.isTrue(
        axiosPostStub.calledWith("https://hooks.slack.com/services/test", {
          text: "Test message",
        })
      );
    });

    it("should send a warning to default channel if the specified channel doesn't exist", async function () {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://hooks.slack.com/services/default",
      });

      await sendToSlack("Test message", {slackChannel: "nonexistent"});

      assert.isTrue(axiosPostStub.calledTwice);
      assert.isTrue(
        axiosPostStub.firstCall.calledWith("https://hooks.slack.com/services/default", {
          text: 'Warning: Attempted to send a Slack message to non-existent channel "nonexistent". Message: Test message',
        })
      );
      assert.isTrue(
        axiosPostStub.secondCall.calledWith("https://hooks.slack.com/services/default", {
          text: "Test message",
        })
      );
    });

    it("should not send a warning to default channel if the specified channel is default itself", async function () {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://hooks.slack.com/services/default",
      });

      await sendToSlack("Test message", {slackChannel: "default"});

      assert.isTrue(axiosPostStub.calledOnce);
      assert.isTrue(
        axiosPostStub.calledWith("https://hooks.slack.com/services/default", {
          text: "Test message",
        })
      );
    });

    it("should handle invalid JSON in SLACK_WEBHOOKS", async function () {
      process.env.SLACK_WEBHOOKS = "invalid json";

      await sendToSlack("Test message", {slackChannel: "test"});

      assert.isTrue(loggerErrorStub.calledOnce);
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
      assert.isFalse(axiosPostStub.called);
    });

    it("should handle missing SLACK_WEBHOOKS", async function () {
      process.env.SLACK_WEBHOOKS = undefined as any;

      await sendToSlack("Test message", {slackChannel: "test"});

      assert.isTrue(loggerDebugStub.calledOnce);
      assert.isTrue(
        loggerDebugStub.calledWith(
          "You must set SLACK_WEBHOOKS in the environment to use sendToSlack."
        )
      );
      assert.isFalse(axiosPostStub.called);
    });

    it("should handle missing default channel", async function () {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        test: "https://hooks.slack.com/services/test",
      });

      await sendToSlack("Test message", {slackChannel: "nonexistent"});

      // No warning is sent because there's no default channel
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
      assert.isTrue(loggerDebugStub.calledOnce);
      assert.isFalse(axiosPostStub.called);
    });

    it("should add environment prefix to message", async function () {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://hooks.slack.com/services/default",
      });

      await sendToSlack("Test message", {env: "test"});

      assert.isTrue(axiosPostStub.calledOnce);
      assert.isTrue(
        axiosPostStub.calledWith("https://hooks.slack.com/services/default", {
          text: "[TEST] Test message",
        })
      );
    });

    it("should throw an error if shouldThrow is true", async function () {
      process.env.SLACK_WEBHOOKS = JSON.stringify({
        default: "https://hooks.slack.com/services/default",
      });

      axiosPostStub.rejects(new Error("Test error"));

      try {
        await sendToSlack("Test message", {shouldThrow: true});
        assert.fail("Expected an error to be thrown");
      } catch (error: any) {
        assert.equal(error.status, 500);
        assert.equal(error.title, "Error posting to slack: Test error");
      }

      assert.isTrue(loggerErrorStub.calledOnce);
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });
  });
});
