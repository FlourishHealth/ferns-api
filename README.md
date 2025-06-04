# ferns-api

This library attempts to make creating REST APIs much easier with Express and Mongoose.
Most REST APIs wind up being a lot of boilerplate, so this tries to cut that down without turning
into a full blown framework of its own. This library is inspired by the
[Django-REST-Framework](https://www.django-rest-framework.org).

### Coming soon:

A frontend library to consume these APIs with Redux Toolkit Query.

## Getting started

To install:

    yarn add ferns-api

## Usage

Assuming we have a model:

    const foodSchema = new Schema<Food>({
      name: String,
      hidden: {type: Boolean, default: false},
      ownerId: {type: "ObjectId", ref: "User"},
    });
    export const FoodModel = model("Food", foodSchema);

We can expose this model as an API like this:

    import express from "express";
    import {fernsRouter, Permissions} from "ferns-api";

    const app = express();
    app.use(
      "/foods",
      fernsRouter(UserModel, {
        permissions: {
          list: [Permissions.IsAny],
          create: [Permissions.IsAuthenticated],
          read: [Permissions.IsAny],
          update: [Permissions.IsOwner],
          delete: [Permissions.IsAdmin],
        },
      })
    );

Now we can perform operations on the Food model in a standard REST way. We've also added some permissioning.

    # Gets a list of foods. Anyone can do this without being authenticated.
    GET /foods
    {
        data: [{_id: "62c86d787c7e2db0bf286acd", name: "Carrots", hidden: false, ownerId: "62c44d9f003d9f8ee8cc9256"}],
        more: false,
        page: 1,
        limit: 100
    }

    # Get a specific food. Anyone can do this.
    GET /foods/62c86d787c7e2db0bf286acd
    {_id: "62c86d787c7e2db0bf286acd", name: "Carrots", hidden: false, ownerId: "62c44d9f003d9f8ee8cc9256"}

    # Creates a new food. Only authenticated users are allowed to do this.
    POST /foods {name: "Broccoli", ownerId: "62c44d9f003d9f8ee8cc9256"}
    {_id: "62c86d787c7e2db0bf286000", name: "Broccoli", hidden: false, ownerId: "62c44d9f003d9f8ee8cc9256"}

    # Updates an existing food. Only the owner of the food can do this, otherwise an error code is returned.
    PATCH /foods/62c86d787c7e2db0bf286acd {name: "Peas And Carrots"}
    {_id: "62c86d787c7e2db0bf286acd", name: "Peas And Carrots", hidden: false, ownerId: "62c44d9f003d9f8ee8cc9256"}

    # Deletes an existing food. Only admins are allowed to do this (users with `user.admin` set to true).
    DELETE /foods/62c86d787c7e2db0bf286acd

You can create your own permissions functions. Check permissions.ts for some examples of how to write them.

## Sentry
To enable Sentry, create a "src/sentryInstrumment.ts" file in your project.

```
// Include dotenv here at the start if you're including configuration from dot files.
import "dotenv/config";

import * as Sentry from "@sentry/node";
import {nodeProfilingIntegration} from "@sentry/profiling-node";

if (process.env.NODE_ENV === "production" && !process.env.SENTRY_DSN) {
  throw new Error("SENTRY_DSN must be set");
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // Only profile integration needs to be added, the rest are defaults and are already added,
    // including Express, mongoose, HTTP, etc.
    nodeProfilingIntegration() as any,
  ],
  // Debug can be helpful for figuruing out why something isn't working.
  // debug: true,
  environment: process.env.SENTRY_ENVIRONMENT ?? "production",
  // Skip some errors if needed.
  ignoreErrors: [
    /^.*ECONNRESET*$/,
    /^.*socket hang up*$/,
  ],
  // Set to 1.0 when testing the integration. Lower these to something like 0.1 or 0.2 in production. You can also use tracesSampler as a function to filter out ones
  // you don't care about.
  tracesSampleRate: 1.0,
  profileSessionSampleRate: 1.0
});
```

Then at the top of your src/index.ts file, before express is imported anywhere:

```
import "./sentryInstrument";
```

## Example

To test out how the API works, you can look at and run [example.ts] by running `yarn build` then running `node dist/example.js` in /ferns-api; while running, you can use a mongoDB client such as Compass to view collections.

## Dev

To continuously compile the package:

    yarn dev

To run tests, linting, and fixing up lint issues:

    yarn lint
    yarn lintfix
    yarn test

To see how your changes will affect the docs:

    yarn docs
    cd docs/
    npx http-server

A lot of dev may require using yarn link. You'll want to keep the `yarn dev` window running to continuously compile:

    yarn link
    cd $your-api-repo
    yarn link ferns-api

