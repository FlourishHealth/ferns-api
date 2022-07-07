import fs from "fs";
import {inspect} from "util";
import winston from "winston";

function isPrimitive(val: any) {
  return val === null || (typeof val !== "object" && typeof val !== "function");
}

function formatWithInspect(val: any) {
  const prefix = isPrimitive(val) ? "" : "\n";
  const shouldFormat = typeof val !== "string";

  return prefix + (shouldFormat ? inspect(val, {depth: null, colors: true}) : val);
}

// Winston doesn't operate like console.log by default, e.g. `logger.error('error', error)` only prints the message
// and no args. Add handling for all the args, while also supporting splat logging.
function printf(timestamp = false) {
  return (info: winston.Logform.TransformableInfo) => {
    const msg = formatWithInspect(info.message);
    const splatArgs = info[Symbol.for("splat") as any] || [];
    const rest = splatArgs.map((data: any) => formatWithInspect(data)).join(" ");
    if (timestamp) {
      return `${info.timestamp} - ${info.level}: ${msg} ${rest}`;
    } else {
      return `${info.level}: ${msg} ${rest}`;
    }
  };
}

// Setup a default console logger.
export const logger = winston.createLogger({
  level: "debug",
  transports: [
    new winston.transports.Console({
      debugStdout: true,
      level: "debug",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(printf(false))
      ),
    }),
  ],
});

export interface LoggingOptions {
  level?: "debug" | "info" | "warn" | "error";
  transports?: winston.transport[];
  disableFileLogging?: boolean;
  disableConsoleLogging?: boolean;
  disableConsoleColors?: boolean;
  showConsoleTimestamps?: boolean;
  logDirectory?: string;
}

export function setupLogging(options?: LoggingOptions) {
  logger.clear();
  if (!options?.disableConsoleLogging) {
    const formats: any[] = [winston.format.simple()];
    if (!options?.disableConsoleColors) {
      formats.push(winston.format.colorize());
    }
    formats.push(winston.format.printf(printf(options?.showConsoleTimestamps)));
    logger.add(
      new winston.transports.Console({
        debugStdout: !options?.level || options?.level === "debug",
        level: options?.level ?? "debug",
        format: winston.format.combine(...formats),
      })
    );
  }
  if (!options?.disableFileLogging) {
    const logDirectory = options?.logDirectory ?? "./log";
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory);
    }

    const FILE_LOG_DEFAULTS = {
      colorize: false,
      compress: true,
      dirname: logDirectory,
      format: winston.format.simple(),
      // 30 days of retention
      maxFiles: 30,
      // 50MB max file size
      maxSize: 1024 * 1024 * 50,
      // Only readable by server user
      options: {mode: 0o600},
    };

    logger.add(
      new winston.transports.Stream({
        ...FILE_LOG_DEFAULTS,
        level: "error",
        handleExceptions: true,
        // Use stream so we can open log in append mode rather than overwriting.
        stream: fs.createWriteStream("error.log", {flags: "a"}),
      })
    );

    logger.add(
      new winston.transports.Stream({
        ...FILE_LOG_DEFAULTS,
        level: "info",
        // Use stream so we can open log in append mode rather than overwriting.
        stream: fs.createWriteStream("out.log", {flags: "a"}),
      })
    );
    if (!options?.level || options?.level === "debug") {
      logger.add(
        new winston.transports.Stream({
          ...FILE_LOG_DEFAULTS,
          level: "debug",
          // Use stream so we can open log in append mode rather than overwriting.
          stream: fs.createWriteStream("debug.log", {flags: "a"}),
        })
      );
    }
  }

  if (options?.transports) {
    for (const transport of options.transports) {
      logger.add(transport);
    }
  }

  logger.debug("Logger set up complete");
}
