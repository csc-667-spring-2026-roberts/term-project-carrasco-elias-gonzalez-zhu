# M4 (File Structure & Architecture)

**CSC 667 Term Project**\
**Milestone: M4 (Express Setup)**

> ⚠️ **Status:** This document is part of the M4 implementation. It has been updated to reflect the finalized M5 setup.

This document explains the current project structure and highlights
newly added files for M4.

---

## Project Structure

```
term-project-carrasco-elias-gonzalez-zhu/
├── src/
│   ├── index.ts                                    # Server entry point (NEW)
│   ├── app.ts                                      # Express app configuration (NEW)
│   │
│   ├── config/
│   │   ├── env.ts                                  # Environment configuration (NEW)
│   │   └── paths.ts                                # Static path resolution (ESM-safe) (NEW)
│   │
│   ├── routes/
│   │   ├── root.routes.ts                          # GET / (NEW)
│   │   └── health.routes.ts                        # GET /health (NEW)
│   │
│   └── middleware/
│       ├── notFound.ts                             # 404 handler (NEW)
│       └── errorHandler.ts                         # Global error handler (NEW)
│
├── public/
│   ├── index.html                                  # Static homepage (NEW)
│   └── styles.css                                  # Basic styling (NEW)
│
docs/
└── m4/
    ├── file-structure-architecture.md  # Architecture documentation (NEW)
    ├── local-setup.md                   # Local setup instructions (NEW)
    └── slides-link.md                   # Presentation link (NEW)
│
├── database/
├── views/
│
├── .husky/
│
├── .editorconfig                                   # Formatting rules (NEW)
├── .gitattributes                                  # Line ending normalization (NEW)
├── .gitignore
├── .nvmrc                                          # Node version lock (NEW)
├── .env.example
├── .prettierrc
│
├── package.json
├── package-lock.json
├── tsconfig.json
├── eslint.config.js
└── README.md
```

---

## Project Root

    term-project-carrasco-elias-gonzalez-zhu/

---

## Configuration Files

    .editorconfig              # (NEW) Enforces consistent formatting across editors
    .gitattributes             # (NEW) Enforces LF line endings
    .nvmrc                     # (NEW) Enforces Node 20 usage
    .gitignore                 # Ignores build artifacts and environment files
    package.json               # Project dependencies and scripts
    package-lock.json          # Locked dependency tree (used by npm ci)
    tsconfig.json              # TypeScript configuration
    eslint.config.js           # ESLint configuration
    .prettierrc                # Prettier configuration
    .env.example               # Environment variable template

---

## Husky

    .husky/                    # Git hooks configuration
      pre-commit               # Runs lint-staged before commits
      _/                       # Husky internal hook helpers

Purpose:

- Enforces linting and formatting before commits.
- Maintains code consistency across team.

---

## Source Code (Backend)

    src/
      index.ts                 # (NEW) Server entry point
      app.ts                   # (NEW) Express application configuration

      config/
        env.ts                 # (NEW) Environment configuration (PORT, NODE_ENV)
        paths.ts               # (NEW) ESM-safe path resolution

      routes/
        root.routes.ts         # (NEW) Handles GET /
        health.routes.ts       # (NEW) Handles GET /health

      middleware/
        notFound.ts            # (NEW) 404 handler
        errorHandler.ts        # (NEW) Global error handler

### index.ts Responsibilities

- Imports `createApp()` from `app.ts`
- Loads environment configuration
- Starts the server on the configured PORT
- Contains **no routing or middleware logic**

### app.ts Responsibilities

- Initializes Express
- Configures global middleware:
  - JSON parsing
  - URL-encoded form parsing
  - Static file serving from `/public`
- Mounts route modules
- Registers 404 and global error-handling middleware
- Returns configured Express app instance

### routes/

- `root.routes.ts`
  - Defines `GET /`
  - Serves the static homepage

- `health.routes.ts`
  - Defines `GET /health`
  - Returns JSON status response

### middleware/

- `notFound.ts`
  - Handles unmatched routes (404 response)

- `errorHandler.ts`
  - Centralized error handler for production safety

---

## Public (Frontend)

    public/
      index.html               # (NEW) Main static page
      styles.css               # (NEW) Basic styling

Purpose:

- Demonstrates Express static file serving
- Provides visual confirmation server is running

---

## Documentation

    docs/
      m4/
        local-setup.md                  # (NEW) Setup & verification instructions
        slides-link.md                  # (NEW) Link to presentation slides
        file-structure-architecture.md  # (NEW) This document
    README.md                           # Project overview

---

## Summary

M4 establishes:

- Modular Express architecture (app, routes, middleware, config)
- Static file serving and health check endpoint
- Centralized error handling
- Strict TypeScript + ESM configuration
- Standardized development workflow (`npm ci`, build, dev)
- Node 20 enforcement and proper Git hygiene
