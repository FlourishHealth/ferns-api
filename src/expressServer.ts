import * as Sentry from "@sentry/node";
import {ProfilingIntegration} from "@sentry/profiling-node";
import openapi from "@wesleytodd/openapi";
import axios from "axios";
import cors from "cors";
import cron from "cron";
import express, {Router} from "express";
import cloneDeep from "lodash/cloneDeep";
import onFinished from "on-finished";
import passport from "passport";
import qs from "qs";

import {FernsRouterOptions} from "./api";
import {addAuthRoutes, setupAuth, UserModel as UserMongooseModel} from "./auth";
import {apiErrorMiddleware, apiUnauthorizedMiddleware} from "./errors";
import {logger, LoggingOptions, setupLogging} from "./logger";

const SLOW_READ_MAX = 200;
const SLOW_WRITE_MAX = 500;

export function setupErrorLogging(app: express.Application, ignoreTraces: string[] = []) {
  const dsn = process.env.SENTRY_DSN;
  if (process.env.NODE_ENV === "production") {
    if (!dsn) {
      throw new Error("You must set SENTRY_DSN in the environment.");
    }
    Sentry.init({
      dsn,
      integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({tracing: true}),
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
        new ProfilingIntegration(),
      ],
      ignoreErrors: [/^.*ECONNRESET*$/, /^.*socket hang up*$/],
      tracesSampler: (samplingContext) => {
        const transactionName = samplingContext.transactionContext.name;
        // ignore any transactions that include a match from the ignoreTraces list
        if (ignoreTraces.some((trace) => transactionName.includes(trace))) {
          return 0.0;
        }
        // otherwise just use the standard sample rate
        return process.env.SENTRY_TRACES_SAMPLE_RATE
          ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
          : 0.1;
      },
      profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE
        ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE)
        : 0.1,
    });
    logger.debug(`Initialized Sentry with DSN ${dsn}`);
  }
}

export function setupEnvironment(): void {
  if (!process.env.TOKEN_ISSUER) {
    throw new Error("TOKEN_ISSUER must be set in env.");
  }
  if (!process.env.TOKEN_SECRET) {
    throw new Error("TOKEN_SECRET must be set.");
  }
  if (!process.env.REFRESH_TOKEN_SECRET) {
    logger.warn("REFRESH_TOKEN_SECRET must be set.");
  }
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set.");
  }
  if (!process.env.TOKEN_EXPIRES_IN) {
    logger.warn("TOKEN_EXPIRES_IN is not set so using default.");
  }
  if (!process.env.REFRESH_TOKEN_EXPIRES_IN) {
    logger.warn("REFRESH_TOKEN_EXPIRES_IN not set so using default.");
  }
}

export type AddRoutes = (router: Router, options?: Partial<FernsRouterOptions<any>>) => void;

const logRequestsFinished = function (req: any, res: any, startTime: [number, number]) {
  const diff = process.hrtime(startTime);
  const diffInMs = Math.round(diff[0] * 1000 + diff[1] * 0.000001);
  let pathName = "unknown";
  if (req.route && req.routeMount) {
    pathName = `${req.routeMount}${req.route.path}`;
  } else if (req.route) {
    pathName = req.route.path;
  } else if (res.statusCode < 400) {
    logger.warn(`Request without route: ${req.originalUrl}`);
  }
  if (!Boolean(process.env.DISABLE_LOG_ALL_REQUESTS)) {
    logger.debug(`${req.method} -> ${req.originalUrl} ${res.statusCode} ${`${diffInMs}ms`}`);
  }
  if (diffInMs > SLOW_READ_MAX && req.method === "GET") {
    logger.warn(
      `Slow GET request, ${JSON.stringify({
        requestTime: diffInMs,
        pathName,
        url: req.originalUrl,
      })}`
    );
  } else if (diffInMs > SLOW_WRITE_MAX) {
    logger.warn(
      `Slow write request ${JSON.stringify({
        requestTime: diffInMs,
        pathName,
        url: req.originalUrl,
      })}`
    );
  }
};

export function logRequests(req: any, res: any, next: any) {
  const startTime = process.hrtime();

  let userString = "";
  if (req.user) {
    let type = "User";
    if (req.user?.admin) {
      type = "Admin";
    } else if (req.user?.testUser) {
      type = "Test User";
    } else if (req.user?.type) {
      type = req.user?.type;
    }
    userString = ` <${type}:${req.user.id}>`;
  }

  let body = "";
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyCopy = cloneDeep(req.body);
    if (bodyCopy.password) {
      bodyCopy.password = "<PASSWORD>";
    }
    body = ` Body: ${JSON.stringify(bodyCopy)}`;
  }

  if (!Boolean(process.env.DISABLE_LOG_ALL_REQUESTS)) {
    logger.debug(`${req.method} <- ${req.url}${userString}${body}`);
  }
  onFinished(res, () => logRequestsFinished(req, res, startTime));
  next();
}

export function createRouter(rootPath: string, addRoutes: AddRoutes, middleware: any[] = []) {
  function routePathMiddleware(req: any, res: any, next: any) {
    if (!req.routeMount) {
      req.routeMount = [];
    }
    req.routeMount.push(rootPath);
    next();
  }

  const router = express.Router();
  router.use(routePathMiddleware);
  addRoutes(router);
  return [rootPath, ...middleware, router];
}

export function createRouterWithAuth(
  rootPath: string,
  addRoutes: (router: Router) => void,
  middleware: any[] = []
) {
  return createRouter(rootPath, addRoutes, [
    passport.authenticate("firebase-jwt", {session: false}),
    ...middleware,
  ]);
}

interface InitializeRoutesOptions {
  corsOrigin?: string;
  addMiddleware?: AddRoutes;
  // The maximum number of array elements to parse in a query string. Defaults to 200.
  arrayLimit?: number;
  // Whether requests should be logged. In production, you may want to disable this if using another
  // logger (e.g. Google Cloud).
  logRequests?: boolean;
  ignoreTraces?: string[];
}

function initializeRoutes(
  UserModel: UserMongooseModel,
  addRoutes: AddRoutes,
  options: InitializeRoutesOptions = {}
) {
  const app = express();

  setupErrorLogging(app, options.ignoreTraces);

  const oapi = openapi({
    openapi: "3.0.0",
    info: {
      title: "Express Application",
      description: "Generated docs from an Express api",
      version: "1.0.0",
    },
  });

  // TODO: Log a warning when we hit the array limit.
  app.set("query parser", (str: string) => qs.parse(str, {arrayLimit: options.arrayLimit ?? 200}));

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  if (options.addMiddleware) {
    options.addMiddleware(app);
  }

  app.use(
    cors({
      origin: options.corsOrigin ?? "*",
    })
  );

  app.use(express.json());

  setupAuth(app as any, UserModel as any);

  if (options.logRequests !== false) {
    app.use(logRequests);
  }
  // Add Sentry scopes for session, transaction, and userId if any are set
  app.all("*", function (req: any, _res: any, next: any) {
    const transactionId = req.header("X-Transaction-ID");
    const sessionId = req.header("X-Session-ID");
    if (transactionId) {
      Sentry.configureScope((scope) => {
        scope.setTag("transaction_id", transactionId);
      });
    }
    if (sessionId) {
      Sentry.configureScope((scope) => {
        scope.setTag("session_id", sessionId);
      });
    }
    if (req.user?._id) {
      Sentry.configureScope((scope) => {
        scope.setUser({id: req.user._id});
      });
    }
    next();
  });

  app.use(oapi);
  app.use("/swagger", oapi.swaggerui);

  addAuthRoutes(app as any, UserModel as any);

  addRoutes(app, {openApi: oapi});

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  // Catch any thrown APIErrors and return them in an OpenAPI compatible format
  app.use(apiUnauthorizedMiddleware);
  app.use(apiErrorMiddleware);

  app.use(function onError(err: any, _req: any, res: any, _next: any) {
    logger.error(`Fallthrough error: ${err}${err?.stack ? `\n${err.stack}` : ""}}`);
    Sentry.captureException(err);
    res.statusCode = 500;
    res.end(`${res.sentry}\n`);
  });

  logger.debug("Listening on routes:");
  app._router.stack.forEach((r: any) => {
    if (r.route && r.route.path) {
      logger.debug(`[Route] ${r.route.path}`);
    }
  });

  return app;
}

export interface SetupServerOptions {
  userModel: UserMongooseModel;
  addRoutes: AddRoutes;
  loggingOptions?: LoggingOptions;
  skipListen?: boolean;
  corsOrigin?: string;
  addMiddleware?: AddRoutes;
  ignoreTraces?: string[];
}

// Sets up the routes and returns a function to launch the API.
export function setupServer(options: SetupServerOptions) {
  const UserModel = options.userModel;
  const addRoutes = options.addRoutes;

  setupLogging(options.loggingOptions);

  let app: express.Application;
  try {
    app = initializeRoutes(UserModel, addRoutes, {
      corsOrigin: options.corsOrigin,
      addMiddleware: options.addMiddleware,
      ignoreTraces: options.ignoreTraces,
    });
  } catch (e) {
    logger.error(`Error initializing routes: ${e}`);
    throw e;
  }

  if (!options.skipListen) {
    const port = process.env.PORT || "9000";
    try {
      app.listen(port, () => {
        logger.info(`Listening at on port ${port}`);
      });
    } catch (err) {
      logger.error(`Error trying to start HTTP server: ${err}\n${(err as any).stack}`);
      process.exit(1);
    }
  }
  return app;
}

// Convenience method to execute cronjobs with an always-running server.
export function cronjob(
  name: string,
  schedule: "hourly" | "minutely" | string,
  callback: () => void
) {
  if (schedule === "hourly") {
    schedule = "0 * * * *";
  } else if (schedule === "minutely") {
    schedule = "* * * * *";
  }
  logger.info(`Adding cronjob ${name}, running at: ${schedule}`);
  try {
    new cron.CronJob(schedule, callback, null, true, "America/Chicago");
  } catch (e) {
    throw new Error(`Failed to create cronjob: ${e}`);
  }
}

// Convenience method to send data to a Slack webhook.
export async function sendToSlack(text: string, channel = "bots") {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK;
  if (!slackWebhookUrl) {
    throw new Error("You must set SLACK_WEBHOOK in the environment.");
  }
  try {
    await axios.post(slackWebhookUrl, {
      text,
      channel,
    });
  } catch (e: any) {
    logger.error(`Error posting to slack: ${e.text}`);
  }
}

export interface WrapScriptOptions {
  onFinish?: (result?: any) => void | Promise<void>;
  terminateTimeout?: number; // in seconds, defaults to 300. Set to 0 to have no termination timeout.
  slackChannel?: string;
}
// Wrap up a script with some helpers, such as catching errors, reporting them to sentry, notifying
// Slack of runs, etc. Also supports timeouts.
export async function wrapScript(func: () => Promise<any>, options: WrapScriptOptions = {}) {
  const name = require.main?.filename.split("/").slice(-1)[0].replace(".ts", "");
  logger.info(`Running script ${name}`);
  await sendToSlack(`Running script ${name}`, options.slackChannel);

  if (options.terminateTimeout !== 0) {
    const warnTime = ((options.terminateTimeout ?? 300) / 2) * 1000;
    const closeTime = (options.terminateTimeout ?? 300) * 1000;
    setTimeout(async () => {
      const msg = `Script ${name} is taking a while, currently ${warnTime / 1000} seconds`;
      await sendToSlack(msg);
      logger.warn(msg);
    }, warnTime);

    setTimeout(async () => {
      const msg = `Script ${name} took too long, exiting`;
      await sendToSlack(msg);
      logger.error(msg);
      Sentry.captureException(new Error(`Script ${name} took too long, exiting`));
      await Sentry.flush();
      process.exit(2);
    }, closeTime);
  }

  let result: any;
  try {
    result = await func();
    if (options.onFinish) {
      await options.onFinish(result);
    }
  } catch (e) {
    Sentry.captureException(e);
    logger.error(`Error running script ${name}: ${e}\n${(e as Error).stack}`);
    await sendToSlack(`Error running script ${name}: ${e}\n${(e as Error).stack}`);
    await Sentry.flush();
    process.exit(1);
  }
  await sendToSlack(`Success running script ${name}: ${result}`);
  // Unclear why we have to exit here to prevent the script for continuing to run.
  process.exit(0);
}
