# M5 Jonathan Backend Checklist
Hearts Project — Milestone 5

This checklist covers the **backend DB integration work** for M5.  
Zoe already scaffolded the `m5` branch (routes stubbed, `db:smoke`, and docs). Your job is to implement **pg-promise + minimal read/write endpoints** and keep the branch clean.

---

## ✅ 0) Before You Start

- [ ] Checkout and update branch:
  ```bash
  git checkout m5
  git pull
  npm ci
  ```
- [ ] Confirm `.env.example` exists and includes:
  ```
  DATABASE_URL=postgres://localhost:5432/term_project_dev
  ```
- [ ] Confirm `database/smoke.sql` exists (used for demo resets)

---

## ✅ 1) Install & Configure pg-promise

### Dependencies
- [ ] Add required packages:
  ```bash
  npm i pg-promise pg
  ```
  *(If the project uses types, add any needed @types packages as appropriate.)*

### Environment
- [ ] Confirm `.env` is gitignored and **NOT committed**
- [ ] Ensure app reads `DATABASE_URL` from environment (via existing dotenv setup)

---

## ✅ 2) Implement Database Connection

Create/implement:
- [ ] `database/connection.ts` (or `src/db/connection.ts` — follow your repo’s chosen location)

Minimum expectations:
- [ ] Uses `pg-promise` with `DATABASE_URL`
- [ ] Exports a reusable `db` instance (no reconnect-per-request)
- [ ] Has a small, readable structure (no extra abstraction needed for M5)

Suggested shape:
- `export default db;` OR `export { db };` (pick one and use consistently)

---

## ✅ 3) Implement the Minimal Demo Schema Hook (Smoke Script)

Goal: `npm run db:smoke` runs `database/smoke.sql` to reset the demo table.

- [ ] Ensure `db:smoke` actually executes `database/smoke.sql` against `term_project_dev`
- [ ] The script should be reliable for a live demo
- [ ] Smoke SQL should:
  - [ ] Drop existing demo table(s) if needed
  - [ ] Create the minimal `games` table
  - [ ] (Optional) Insert 1 seed row for demo clarity

If the repo uses a node script for smoke:
- [ ] Keep it simple and document how it runs in `m5-local-setup.md`

---

## ✅ 4) Implement GET + POST Endpoints (Read + Write)

Target: `src/routes/games.routes.ts`

### Route Contract (Minimal)
- [ ] `GET /api/games` returns a JSON array of rows from `games`
- [ ] `POST /api/games` inserts a row, returns inserted row (or success object)

### POST Body (Keep Minimal)
Choose a small payload (example):
```json
{
  "name": "Hearts Demo Game",
  "status": "created"
}
```

### Parameterized Queries (Required)
- [ ] Use parameterized queries (no string concatenation)
- [ ] Validate required fields and return `400` if missing

### Error Handling
- [ ] Wrap DB calls with try/catch
- [ ] Return `500` with a safe message on unexpected errors
- [ ] Log the real error server-side (console is fine for M5)

---

## ✅ 5) Confirm app.ts Mounting & Route Behavior

- [ ] Confirm `/api/games` is mounted in `src/app.ts`
- [ ] Replace any `501` stub response with real behavior
- [ ] Ensure routes are reachable in dev mode

---

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
- [ ] POST:
  - URL: `POST /api/games`
  - Confirm row inserted
- [ ] GET:
  - URL: `GET /api/games`
  - Confirm JSON returns expected row(s)

*(Use Postman, curl, or VSCode REST client—anything is fine.)*

---

## ✅ 7) Demo Readiness (Presentation-Safe)

- [ ] `npm run db:smoke` works every time (no flaky steps)
- [ ] If DB is down/misconfigured, the app fails with a clear error (not silent)
- [ ] Endpoints respond quickly and consistently
- [ ] Keep output clean (don’t spam logs)

---

## ✅ 8) Commit & Push Checklist

Before committing:
- [ ] No `.env` committed
- [ ] No secrets committed
- [ ] `npm run build` and `npm run lint` pass

Commit message suggestion:
- `feat(m5): add pg-promise connection and games read/write routes`

Then:
```bash
git status
git add -A
git commit -m "feat(m5): add pg-promise connection and games read/write routes"
git push
```

---

## ✅ 9) Notify Team After Push

Message the team with:
- [ ] What you implemented (connection + routes)
- [ ] Any local setup steps that changed
- [ ] Confirmed commands:
  - `npm ci`
  - `cp .env.example .env` (if needed)
  - `npm run db:smoke`
  - `npm run dev`

---

M5 Backend Checklist — Jonathan
