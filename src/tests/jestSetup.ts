import {setupEnvironment} from "../expressServer";

beforeEach(function () {
  process.env.TOKEN_SECRET = "secret";
  process.env.TOKEN_ISSUER = "ferns-api.test";
  process.env.SESSION_SECRET = "sessionSecret";
  process.env.REFRESH_TOKEN_SECRET = "refreshTokenSecret";
  setupEnvironment();
});
