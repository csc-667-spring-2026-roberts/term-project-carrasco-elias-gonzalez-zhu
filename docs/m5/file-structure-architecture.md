# M5 (File Structure & Architecture)

**CSC 667 Term Project**  
**Milestone: M5 (Database Integration)**

> ⚠️ **Status:** This guide has been updated to reflect the finalized M5 setup.

This document explains structural additions made for M5.  
Only **new or modified components introduced in M5** are described below.  
All previously documented M4 architecture remains unchanged (see **[M4 File Structure & Architecture](../m4/file-structure-architecture.md)**).

------------------------------------------------------------------------

## Project Structure (M5 Additions Highlighted)

```
term-project-carrasco-elias-gonzalez-zhu/
├── database/
│   ├── connection.ts                              # (NEW) PostgreSQL connection module
│   └── smoke.sql                                  # (NEW) Demo schema + seed reset script
│
├── src/
│   ├── config/
│   │   └── env.ts                                 # (UPDATED) Centralized environment config + DATABASE_URL validation
│   ├── middleware/
│   │   └── errorHandler.ts                        # (UPDATED) Uses env config for environment-based error handling
│
├── docs/
│   └── m5/
│       ├── demo-checklist.md                      # (NEW) Demo execution guide
│       ├── file-structure-archeitecture.md        # (NEW) Architecture documentation
│       ├── jonathan-backend-checklist.md          # (NEW) Backend implementation checklist
│       ├── local-setup.md                         # (NEW) M5 local setup instructions
│       ├── postgresql-installation.md             # (NEW) PostgreSQL installation guide
│       └── slides-link.md                         # (NEW) Presentation slides link
│
├── package.json                                   # (UPDATED) Added pg-promise + db:smoke script + dotenv support
└── package-lock.json                              # (UPDATED) Locked dependency tree updated
└── .env.example                                   # (UPDATED) Added OS-aware DATABASE_URL configuration
```

------------------------------------------------------------------------

## Database Layer (NEW)

    database/

### connection.ts

Purpose:
- Initializes pg-promise using `DATABASE_URL`
- Exports a reusable `db` instance
- Centralizes all database connectivity logic

Responsibilities:
- Reads database connection string from environment
- Prevents reconnect-per-request pattern
- Serves as single integration point between Express routes and PostgreSQL

Architectural Impact:
- Introduces a dedicated database layer
- Keeps routing logic separated from connection logic
- Maintains modular backend structure established in M4

### smoke.sql

Purpose:
- Provides a deterministic database reset for demo reliability

Responsibilities:
- Drops existing `games` table if present
- Recreates table:
  - `id`
  - `name`
  - `status`
  - `created_at`
- Inserts one seeded baseline row

Architectural Impact:
- Ensures consistent demo state
- Enables repeatable testing across all team members
- Separates schema definition from application logic

------------------------------------------------------------------------

## New Route Module

    src/routes/games.routes.ts

Purpose:
- Implements RESTful database interaction for M5

Endpoints:
- `GET /api/games`
- `POST /api/games`

Responsibilities:
- Executes parameterized SQL queries
- Validates request body fields (`name`, `status`)
- Returns JSON responses
- Integrates with centralized error handling

Architectural Impact:
- Extends modular routing pattern established in M4
- Demonstrates separation of concerns:
  - Routes handle HTTP
  - Connection module handles DB
  - Smoke script handles schema reset

------------------------------------------------------------------------

## Updates

### env.ts

New Additions:

- `databaseUrl` extracted from `process.env.DATABASE_URL`
- Validation to ensure `DATABASE_URL` is provided
- Exported `env` object now includes `databaseUrl`

Example:

```ts
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required but was not provided.");
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl,
};
```

Purpose:
- Centralizes environment variable handling
- Ensures required variables are validated at startup
- Prevents runtime errors from missing configuration
- Provides a single source of truth for environment values

### errorHandler.ts

Updates:

- Replaced direct `process.env.NODE_ENV` usage with `env.nodeEnv`
- Imported centralized config from `env.ts`

Example:

```ts
const message =
  env.nodeEnv === "development"
    ? err instanceof Error
      ? err.message
      : String(err)
    : "Internal Server Error";
```

Purpose:
- Aligns with centralized environment configuration pattern
- Avoids direct dependency on `process.env`
- Keeps environment logic consistent across the application
- Improves maintainability and readability

### package.json

New Additions:

- `dotenv-cli` dependency
- Updated `"db:smoke"` script to load `.env` correctly across platforms

Updated Script:

```json
"db:smoke": "dotenv -e .env -- sh -c 'psql \"$DATABASE_URL\" -f database/smoke.sql'"
```

Purpose:
- Ensures `.env` variables are loaded reliably on both Mac and Windows
- Fixes cross-platform issues with environment variable resolution
- Allows consistent database setup using a single command

### package-lock.json

- Updated automatically to reflect dependency changes

### .env.example

Updates:

- Added OS-aware `DATABASE_URL` configuration (Mac + Windows)
- Clarified that Mac uses default connection and Windows requires credentials
- Added comments for `PORT` and `SESSION_SECRET`

Example:

```env
# DATABASE_URL

# Mac (default)
DATABASE_URL=postgres://localhost:5432/term_project_dev

# Windows (see docs/m5/postgresql-installation.md for configuration)
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/term_project_dev
```

Purpose:
- Provides a clear and consistent environment template for all team members
- Supports both Mac and Windows setups without requiring multiple files
- Reduces setup errors and confusion during onboarding
- Keeps environment configuration standardized across the team

------------------------------------------------------------------------

## Documentation (NEW M5 Folder)

    docs/m5/

Purpose:
- Centralizes all M5-related setup and demo documentation
- Separates milestone-specific instructions from core architecture

Includes:
- Postgresql Installation guide
- Backend implementation checklist
- Local setup instructions
- Demo execution script
- Slides reference link

------------------------------------------------------------------------

## Summary

M5 extends the M4 architecture by adding:

- A dedicated database integration layer
- PostgreSQL connectivity via pg-promise
- Parameterized GET and POST routes
- A deterministic schema reset script (`db:smoke`)
- Centralized environment configuration (`env.ts`)
- Cross-platform `.env` handling (Mac + Windows compatibility)
- Structured milestone documentation for backend + demo execution

The overall architecture remains modular, with clear separation between:

- Express configuration (M4)
- Environment configuration (env.ts)
- Database integration (M5)
- Documentation and milestone workflow management