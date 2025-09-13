declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    LOGGING_LEVEL: "debug" | "info" | "warn" | "error";
    SENTRY_DSN: string;
    SENTRY_TRACES_SAMPLE_RATE: string;
    SENTRY_PROFILES_SAMPLE_RATE: string;
    SLACK_WEBHOOKS?: string;
    GOOGLE_CHAT_WEBHOOKS?: string;
    SESSION_SECRET: string;
    TOKEN_ISSUER: string;
    TOKEN_EXPIRES_IN: string;
    REFRESH_TOKEN_SECRET: string;
    DISABLE_LOG_ALL_REQUESTS: string;
  }
}
