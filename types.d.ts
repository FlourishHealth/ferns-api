declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: "development" | "production";
    LOGGING_LEVEL: "debug" | "info" | "warn" | "error";
    SENTRY_DSN: string;
    SENTRY_TRACES_SAMPLE_RATE: string;
    SENTRY_PROFILES_SAMPLE_RATE: string;
    SLACK_WEBHOOK: string;
    SESSION_SECRET: string;
    TOKEN_ISSUER: string;
    TOKEN_EXPIRES_IN: string;
    REFRESH_TOKEN_SECRET: string;
  }
}
