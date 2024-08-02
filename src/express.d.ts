declare namespace Express {
  export interface Request {
    user?: {_id: string | ObjectId; id: string; admin: boolean};
    userAgent?: {
      browser: string;
      version: string;
      os: string;
      platform: string;
      source: string;
    };
  }
}
