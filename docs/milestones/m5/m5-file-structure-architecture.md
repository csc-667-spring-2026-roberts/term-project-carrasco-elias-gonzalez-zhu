# M5 (File Structure & Architecture)

**CSC 667 Term Project**  
**Milestone: M5 (Database Integration)**

This document explains structural additions made for M5.  
Only **new or modified components introduced in M5** are described below.  
All previously documented M4 architecture remains unchanged.

------------------------------------------------------------------------

## Project Structure (M5 Additions Highlighted)

```
term-project-carrasco-elias-gonzalez-zhu/
├── database/
│   ├── connection.ts                              # (NEW) PostgreSQL connection module
│   └── smoke.sql                                  # (NEW) Demo schema + seed reset script
│
├── src/
│   └── routes/
│       └── games.routes.ts                        # (NEW) GET + POST /api/games
│
├── docs/
│   └── milestones/
│       └── m5/
│           ├── m5-local-setup.md                  # (NEW) M5 local setup instructions
│           ├── m5-postgresql-installation.md      # (NEW) PostgreSQL installation guide
│           ├── m5-jonathan-backend-checklist.md   # (NEW) Backend implementation checklist
│           ├── m5-demo-checklist.md               # (NEW) Demo execution guide
│           └── m5-slides-link.md                  # (NEW) Presentation slides link
│
├── package.json                                   # (UPDATED) Added pg-promise + db:smoke script
└── package-lock.json                              # (UPDATED) Locked dependency tree updated
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

------------------------------------------------------------------------

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

## package.json (Updated)

New Additions:

- `pg-promise` dependency
- `pg` dependency
- `"db:smoke"` script

Example Script:

```
"db:smoke": "psql "$DATABASE_URL" -f database/smoke.sql"
```

Purpose:
- Allows consistent schema reset via command line
- Ensures all team members can reproduce demo state

------------------------------------------------------------------------

## Documentation (NEW M5 Folder)

    docs/milestones/m5/

Purpose:
- Centralizes all M5-related setup and demo documentation
- Separates milestone-specific instructions from core architecture

Includes:
- Installation guide
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
- Standardized environment-based DB configuration
- Structured milestone documentation for backend + demo execution

The overall architecture remains modular, with clear separation between:

- Express configuration (M4)
- Database integration (M5)
- Documentation and milestone workflow management