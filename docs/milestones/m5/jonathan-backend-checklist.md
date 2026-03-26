# M5 (Jonathan Backend Checklist)

**CSC 667 Term Project**\
**Milestone: M5 (Database Integration)**

> ⚠️ **Status:** This document is part of the M5 implementation.  
> It is retained here for reference and documentation purposes.

This checklist covers the **backend DB integration work** for M5.
Zoe already scaffolded the `m5` branch (routes stubbed, `db:smoke`, and docs).
Jonathan's job is to implement **pg-promise + minimal read/write endpoints** and keep the branch clean.

---

## ✅ 0) Before You Start

- [ ] Checkout and update branch:
  ```bash
  git checkout m5
  git pull
  npm ci
  ```
- [ ] **Install PostgreSQL (Required)**
  - Install PostgreSQL locally by following **[M5 PostgreSQL Installation Guide](m5-postgresql-installation.md)**
- [ ] Confirm `.env.example` exists and includes:
  ```
  DATABASE_URL=postgres://localhost:5432/term_project_dev
  ```
- [ ] Confirm `database/smoke.sql` exists (used for demo resets)

## ✅ 1) Install & Configure pg-promise

### Dependencies

- [ ] Add required packages:
  ```bash
  npm i pg-promise pg
  ```

### Environment

- [ ] Confirm `.env` is gitignored and **NOT committed**
- [ ] Ensure app reads `DATABASE_URL` from environment (via existing dotenv setup)

## ✅ 2) Implement Database Connection

Implement:

- [ ] `database/connection.ts`

Minimum expectations:

- [ ] Uses `pg-promise` with `DATABASE_URL`
- [ ] Exports a reusable `db` instance (no reconnect-per-request)
- [ ] Has a small, readable structure (no extra abstraction needed for M5)

Suggested shape:

- `export default db;` OR `export { db };` (pick one and use consistently)

## ✅ 3) Verify Demo Schema Reset (Smoke Script)

Goal: `npm run db:smoke` resets the demo table to a known baseline.

- [ ] Confirm `npm run db:smoke` executes successfully
- [ ] Confirm it recreates the `games` table
- [ ] Confirm it inserts 1 seeded row
- [ ] After implementing routes: confirm GET works immediately after reset

Note:
`database/smoke.sql` defines the demo schema and seed row.
_Coordinate before modifying it._

## ✅ 4) Implement GET + POST Endpoints (Read + Write)

Target: `src/routes/games.routes.ts`
Table schema (from smoke.sql): `games(id, name, status, created_at)`

### Route Contract (Minimal)

- [ ] `GET /api/games` returns a JSON array of rows from `games`
- [ ] `POST /api/games` inserts a row and returns the inserted row (201 Created)

### POST Body (Keep Minimal)

Choose a small payload (example):

```json
{
  "name": "Hearts Match - Round 2",
  "status": "created"
}
```

### Parameterized Queries (Required)

- [ ] Validate name and status exist → return 400 if missing
- [ ] Use parameterized queries (no string concatenation)

### Error Handling

- [ ] Wrap DB calls with try/catch
- [ ] Return `500` with a safe message on unexpected errors
- [ ] Log the real error server-side (console is fine for M5)

## ✅ 5) Confirm app.ts Mounting & Route Behavior

- [ ] Confirm `/api/games` is mounted in `src/app.ts`
- [ ] Replace any `501` stub response with real behavior
- [ ] Ensure routes are reachable in dev mode

## ✅ 6) Local Verification Steps (You Must Run)

### Build/Lint Gate (Required)

Before pushing:

- [ ] `npm run build`
- [ ] `npm run lint`

### Smoke + Dev Run

- [ ] Reset demo table:
  ```bash
  npm run db:smoke
  ```
- [ ] Start server:
  ```bash
  npm run dev
  ```

### Manual API Test (Required)

- [ ] Run `npm run db:smoke`
- [ ] GET `/api/games` → should return 1 seeded row
- [ ] POST `/api/games` with `{ name, status }`
- [ ] GET `/api/games` → should return 2 rows (seed + new)

_(Use Postman, curl, or VSCode REST client—anything is fine.)_

## ✅ 7) Demo Readiness (Presentation-Safe)

- [ ] `npm run db:smoke` works every time (no flaky steps)
- [ ] If DB is down/misconfigured, the app fails with a clear error (not silent)
- [ ] Endpoints respond quickly and consistently
- [ ] Keep output clean (don’t spam logs)

## ✅ 8) Commit & Push Checklist

Before committing:

- [ ] No `.env` committed
- [ ] No secrets committed
- [ ] `npm run build` and `npm run lint` pass
- [ ] `package-lock.json` is included (after installing dependencies)
- [ ] **Only expected files changed:**
  - **database/connection.ts**
  - **src/routes/games.routes.ts**
  - **package.json**
  - **package-lock.json**

Commit message suggestion:

- `feat(m5): add pg-promise connection and games read/write routes`

Then:

```bash
git status
git add -A
git commit -m "feat(m5): add pg-promise connection and games read/write routes"
git push
```

## ✅ 9) Notify Team After Push

Message the team on discord that you finished pushing so they can follow **Part B** in **[M5 Local Setup Guide](m5-local-setup.md)**
