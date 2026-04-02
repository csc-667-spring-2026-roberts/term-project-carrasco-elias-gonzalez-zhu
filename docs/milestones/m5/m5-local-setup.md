# M5 (Local Setup Guide)

**CSC 667 Term Project**\
**Milestone: M5 (Database Integration)**

> ⚠️ **Status:** This guide reflects the finalized M5 setup.  
> All steps must be completed successfully before proceeding to M6.
> This guide outlines what each team member must do for M5.

👉 **Before proceeding**, ensure you have completed all steps in  
**[M4 Local Setup & Verification Guide](../m4/m4-local-setup.md)**

---

## 0) Switch to the M5 Branch

```bash
git checkout m5
git pull
npm ci
```

---

## 1) Install PostgreSQL

Install and connect to PostgreSQL locally by following:

👉 **[M5 PostgreSQL Installation Guide](m5-postgresql-installation.md)→ Step 1 - 4**

---

## 2) Create Local Development Database

Create and verify your local database by following:

👉 **[M5 PostgreSQL Installation Guide](m5-postgresql-installation.md) → Step 5 (Create Database)**

Expected:

- `term_project_dev` exists
- ⚠️ Do NOT create tables manually
  - `npm run db:smoke` will handle schema setup after integration is merged.

---

## 3) Configure Environment Variable

Create and configure your `.env` file by following:

👉 **[M5 PostgreSQL Installation Guide](m5-postgresql-installation.md) → Step 6 (Configure DATABASE_URL)**

Expected:

- `.env` exists in the project root
- `DATABASE_URL` is configured correctly for your OS
- the database name is `term_project_dev`
- ⚠️ `.env` must NOT be committed (already in `.gitignore`)

---

## 4) Run Database Schema

Run the database schema setup by following:

👉 **[M5 PostgreSQL Installation Guide](m5-postgresql-installation.md) → Step 7 (Run Smoke Test)**

Expected:

- No errors
- Tables are created

**Any errors refer to:**

👉 **[M5 PostgreSQL Installation Guide](m5-postgresql-installation.md) → Troubleshooting**

---

## 5) Verify Demo Endpoints

Use the steps below to confirm your local M5 setup is working correctly.

### Step 1: Reset the Database Baseline

Run:

```bash
npm run db:smoke
```

Expected:

- The `games` table is dropped and recreated
- One seeded row is inserted

This ensures testing always starts from a clean, known state.

### Step 2: Start the Server

Run:

```bash
npm run dev
```

Expected:

- The server starts successfully
- It runs on `http://localhost:3000`

Leave this terminal running.

### Step 3: Verify the Baseline Row

Open this URL in your browser:

**http://localhost:3000/api/games**

Expected:

- JSON is returned
- Exactly **1 row** appears

This confirms the backend can successfully read from PostgreSQL.

### Step 4: Insert a New Row with POST

Open a new terminal window/tab and run:

```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{"name":"Hearts Match - Round 2","status":"created"}'
```

Expected:

- The server responds successfully
- JSON for the inserted row is returned

This confirms the backend can successfully write to PostgreSQL.

### Step 5: Verify Persistence

Refresh:

**http://localhost:3000/api/games**

Expected:

- JSON is returned
- Exactly **2 rows** appear:
  - the seeded baseline row
  - the new row added with POST

This confirms the inserted data persisted in PostgreSQL.

### Local Verification Complete When:

- `npm run db:smoke` runs successfully
  - The database is reset with a clean baseline

---

- `npm run dev` starts the server
  - Server runs at: [insert here]
  - No errors appear in the terminal

---

- GET `/api/games` returns exactly **1 row**

  Expected response should include:
  - `"name": "Hearts Match - Round 1"`
  - `"status": "waiting"`

  Example (simplified):

  ```json
  {
    "id": 1,
    "name": "Hearts Match - Round 1",
    "status": "waiting"
  }
  ```

- POST `/api/games` succeeds

  Request body:

  ```json
  {
    "name": "Hearts Match - Round 2",
    "status": "created"
  }
  ```

  Expected:
  - Server returns the newly created row
  - No errors in terminal

---

- GET `/api/games` now returns exactly **2 rows**

  Expected:
  - First row:
    - `"name": "Hearts Match - Round 1"`
    - `"status": "waiting"`
  - Second row:
    - `"name": "Hearts Match - Round 2"`
    - `"status": "created"`

  Example (simplified):

  ```json
  {
    "id": 1,
    "name": "Hearts Match - Round 1",
    "status": "waiting"
  },
  {
    "id": 2,
    "name": "Hearts Match - Round 2",
    "status": "created"
  }
  ```

- JSON is returned correctly
  - Data is in JSON format (array of objects)
  - No server or database errors occur

### If Something Looks Wrong

If you see too many rows or unexpected data:

```bash
npm run db:smoke
```

- Then repeat Steps 3–5.

If POST returns `400 Bad Request`:

- Make sure the JSON body includes both:
  - `name`
  - `status`

If the server shows database errors:

- Confirm PostgreSQL is running
- Confirm `term_project_dev` exists
- Confirm `.env` has the correct `DATABASE_URL`

---

# M5 Sanity Checklist

- On `m5` branch
- `npm ci` completed successfully
- PostgreSQL installed and running (`psql --version`)
- Local database (`term_project_dev`) created
- `.env` configured with correct `DATABASE_URL`
- `npm run db:smoke` runs without errors (1 seeded row)
- Demo endpoints verified:
  - GET `/api/games` → 1 row
  - POST `/api/games` → succeeds
  - GET `/api/games` → 2 rows
