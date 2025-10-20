/* eslint import/no-default-export: off */

// Mock implementation for @sentry/node
export const init = jest.fn();
export const captureException = jest.fn();
export const captureMessage = jest.fn();
export const addBreadcrumb = jest.fn();
export const configureScope = jest.fn();
export const withScope = jest.fn((callback) => callback(mockScope));
export const setTag = jest.fn();
export const setTags = jest.fn();
export const setUser = jest.fn();
export const setContext = jest.fn();
export const setLevel = jest.fn();
export const setFingerprint = jest.fn();
export const clearScope = jest.fn();
export const pushScope = jest.fn();
export const popScope = jest.fn();
export const getCurrentHub = jest.fn(() => mockHub);
export const getClient = jest.fn(() => mockClient);
export const flush = jest.fn(() => Promise.resolve(true));
export const close = jest.fn(() => Promise.resolve(true));
export const isInitialized = jest.fn(() => true);

// Mock Scope
const mockScope = {
  setTag: jest.fn(),
  setTags: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  setLevel: jest.fn(),
  setFingerprint: jest.fn(),
  clear: jest.fn(),
  addBreadcrumb: jest.fn(),
  setSpan: jest.fn(),
  getSpan: jest.fn(),
  setTransactionName: jest.fn(),
};

// Mock Hub
const mockHub = {
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  configureScope: jest.fn(),
  withScope: jest.fn(),
  pushScope: jest.fn(),
  popScope: jest.fn(),
  getClient: jest.fn(() => mockClient),
  getScope: jest.fn(() => mockScope),
  setTag: jest.fn(),
  setTags: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
};

// Mock Client
const mockClient = {
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  flush: jest.fn(() => Promise.resolve(true)),
  close: jest.fn(() => Promise.resolve(true)),
  getOptions: jest.fn(() => ({})),
};

// Severity levels
export const Severity = {
  Fatal: "fatal",
  Error: "error",
  Warning: "warning",
  Info: "info",
  Debug: "debug",
} as const;

// Transaction and tracing mocks
export const startTransaction = jest.fn(() => mockTransaction);
export const getCurrentScope = jest.fn(() => mockScope);
export const setupExpressErrorHandler = jest.fn();

const mockTransaction = {
  setTag: jest.fn(),
  setData: jest.fn(),
  setStatus: jest.fn(),
  finish: jest.fn(),
  startChild: jest.fn(() => mockSpan),
  toTraceparent: jest.fn(() => "mock-trace-parent"),
  setName: jest.fn(),
};

const mockSpan = {
  setTag: jest.fn(),
  setData: jest.fn(),
  setStatus: jest.fn(),
  finish: jest.fn(),
  startChild: jest.fn(() => mockSpan),
  toTraceparent: jest.fn(() => "mock-trace-parent"),
};

// Express integration mock
export const Handlers = {
  requestHandler: jest.fn(() => (req: any, res: any, next: any) => next()),
  errorHandler: jest.fn(() => (err: any, req: any, res: any, next: any) => next(err)),
  tracingHandler: jest.fn(() => (req: any, res: any, next: any) => next()),
};

// Default export (some projects might use default import)
const Sentry = {
  init,
  captureException,
  captureMessage,
  addBreadcrumb,
  configureScope,
  withScope,
  setTag,
  setTags,
  setUser,
  setContext,
  setLevel,
  setFingerprint,
  clearScope,
  pushScope,
  popScope,
  getCurrentHub,
  getClient,
  flush,
  close,
  isInitialized,
  Severity,
  startTransaction,
  getCurrentScope,
  setupExpressErrorHandler,
  Handlers,
};

export default Sentry;
