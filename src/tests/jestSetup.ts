import {Writable} from "stream";
import winston from "winston";

import {setupEnvironment} from "../expressServer";
import * as loggerModule from "../logger";
import {winstonLogger} from "../logger";

let logs: string[] = [];
let testFailed = false;

// Create a custom stream that captures logs
const logStream = new Writable({
  write(chunk: any, encoding: any, callback: any) {
    logs.push(chunk.toString());
    callback();
  },
});

// Silence both winston loggers by replacing all transports with our capturing stream
const silentTransport = new winston.transports.Stream({
  stream: logStream,
  format: winston.format.simple(),
});

// Clear and silence the default winston logger
winston.clear();
winston.add(silentTransport);

// Clear and silence the custom winstonLogger
winstonLogger.clear();
winstonLogger.add(silentTransport);

// Monkey-patch setupLogging to prevent it from reconfiguring the logger in tests
(loggerModule as any).setupLogging = (_options?: any) => {
  // Clear winston and re-add our silent transport instead of using the original setup
  winston.clear();
  winston.add(silentTransport);
  winstonLogger.clear();
  winstonLogger.add(silentTransport);
};

// Capture and silence console methods
/* eslint-disable no-console */
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};
/* eslint-enable no-console */

const captureConsoleMethod = (method: keyof typeof originalConsole) => {
  (console as any)[method] = (...args: any[]) => {
    logs.push(
      `[console.${method}] ${args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")}`
    );
  };
};

captureConsoleMethod("log");
captureConsoleMethod("info");
captureConsoleMethod("warn");
captureConsoleMethod("error");
captureConsoleMethod("debug");

// Helper function to wrap test functions with error tracking
const wrapTestFunction = (fn: any) => {
  if (!fn) {
    return fn;
  }
  return async function (this: any, ...args: any[]) {
    try {
      await fn.apply(this, args);
    } catch (error) {
      testFailed = true;
      throw error;
    }
  };
};

// Wrap it() to track test failures
const originalIt = global.it;
global.it = ((name: string, fn?: any, timeout?: number) => {
  return originalIt(name, wrapTestFunction(fn), timeout);
}) as any;

// Wrap beforeEach to track failures
const originalBeforeEach = global.beforeEach;
global.beforeEach = ((fn?: any, timeout?: number) => {
  return originalBeforeEach(wrapTestFunction(fn), timeout);
}) as any;

// Wrap beforeAll to track failures
const originalBeforeAll = global.beforeAll;
global.beforeAll = ((fn?: any, timeout?: number) => {
  return originalBeforeAll(wrapTestFunction(fn), timeout);
}) as any;

// Wrap afterEach to track failures
const originalAfterEach = global.afterEach;
global.afterEach = ((fn?: any, timeout?: number) => {
  return originalAfterEach(wrapTestFunction(fn), timeout);
}) as any;

// Wrap afterAll to track failures
const originalAfterAll = global.afterAll;
global.afterAll = ((fn?: any, timeout?: number) => {
  return originalAfterAll(wrapTestFunction(fn), timeout);
}) as any;

// Setup before each test
beforeEach(function () {
  process.env.TOKEN_SECRET = "secret";
  process.env.TOKEN_ISSUER = "ferns-api.test";
  process.env.SESSION_SECRET = "sessionSecret";
  process.env.REFRESH_TOKEN_SECRET = "refreshTokenSecret";
  setupEnvironment();
  logs = [];
  testFailed = false;
});

// Output logs after each test if it failed
afterEach(function () {
  if (testFailed && logs.length > 0) {
    // Use original console.log to actually output the logs
    originalConsole.log("\nLogs for failed test:\n", logs.join("\n"));
  }
});
