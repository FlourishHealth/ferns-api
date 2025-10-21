import winston from "winston";

import {setupEnvironment} from "../expressServer";
import {winstonLogger} from "../logger";

let logs: string[] = [];
let testFailed = false;

winstonLogger.clear();
winstonLogger.add(
  new winston.transports.Console({
    silent: true,
    format: winston.format.simple(),
  })
);

winstonLogger.on("data", (log: any) => {
  logs.push(JSON.stringify(log));
});

const originalIt = global.it;
global.it = ((name: string, fn?: any, timeout?: number) => {
  return originalIt(
    name,
    async function (this: any, ...args: any[]) {
      testFailed = false;
      try {
        if (fn) {
          await fn.apply(this, args);
        }
      } catch (error) {
        testFailed = true;
        throw error;
      }
    },
    timeout
  );
}) as any;

beforeEach(function () {
  process.env.TOKEN_SECRET = "secret";
  process.env.TOKEN_ISSUER = "ferns-api.test";
  process.env.SESSION_SECRET = "sessionSecret";
  process.env.REFRESH_TOKEN_SECRET = "refreshTokenSecret";
  setupEnvironment();
  logs = [];
  testFailed = false;
});

afterEach(function () {
  if (testFailed && logs.length > 0) {
    // eslint-disable-next-line no-console
    console.log("\nLogs for failed test:\n", logs.join("\n"));
  }
});
