# CLAUDE.md

This file provides guidance for Claude Code when working with this repository.

## Project Overview

ferns-api is a batteries-included REST API framework for Node.js built on Express and Mongoose. It's inspired by Django REST Framework, providing standardized patterns for building REST APIs with minimal boilerplate.

## Tech Stack

- **Language**: TypeScript (ES5 target, CommonJS modules)
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB via Mongoose
- **Authentication**: Passport.js (JWT, local, anonymous strategies)
- **Linter/Formatter**: Biome
- **Testing**: Jest with Supertest
- **Package Manager**: Yarn

## Common Commands

```bash
yarn build        # Compile TypeScript
yarn dev          # Watch mode compilation
yarn test         # Run tests (runs sequentially with -i flag)
yarn lint         # Check linting with Biome
yarn lintfix      # Auto-fix lint issues
yarn docs         # Generate TypeDoc documentation
```

## Code Style (Biome Configuration)

- **Indent**: 2 spaces
- **Line width**: 100 characters
- **Quotes**: Double quotes for strings and JSX
- **Semicolons**: Always required
- **Trailing commas**: ES5 style
- **Bracket spacing**: No spaces (`{foo}` not `{ foo }`)
- **Arrow functions**: Always use parentheses around parameters

Run `yarn lintfix` before committing to ensure code style compliance.

## Project Structure

```
src/
├── api.ts           # Core fernsRouter and API logic
├── auth.ts          # Authentication utilities and middleware
├── permissions.ts   # Permission classes (IsAny, IsAuthenticated, IsOwner, IsAdmin, etc.)
├── expressServer.ts # Express server setup utilities
├── logger.ts        # Winston-based logging
├── errors.ts        # Custom error types
├── transformers.ts  # Data transformation utilities
├── plugins.ts       # Mongoose plugin integrations
├── populate.ts      # Mongoose population helpers
├── openApi.ts       # OpenAPI/Swagger generation
├── utils.ts         # General utilities
├── notifiers/       # Notification integrations (Slack, email, push)
├── tests/           # Test utilities and fixtures
└── *.test.ts        # Test files (co-located with source)
```

## Key Patterns

### Creating API Routes

```typescript
import {fernsRouter, Permissions} from "ferns-api";

app.use("/resource", fernsRouter(Model, {
  permissions: {
    list: [Permissions.IsAny],
    create: [Permissions.IsAuthenticated],
    read: [Permissions.IsAny],
    update: [Permissions.IsOwner],
    delete: [Permissions.IsAdmin],
  },
}));
```

### Tests

- Tests are co-located with source files (`*.test.ts`)
- Run with `yarn test` (sequential execution)
- Use Supertest for HTTP assertions
- MongoDB memory server is used for test database

## TypeScript Configuration Notes

- Strict mode enabled with `strictNullChecks`
- `noImplicitAny` is disabled
- `esModuleInterop` enabled for CommonJS/ES module interop
- Declaration files are generated (`declaration: true`)
