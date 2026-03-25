# M5 (Demo Checklist)

**CSC 667 Term Project**  
**Milestone: M5 (Database Integration)**

> ⚠️ **Status:** This document is part of the M5 implementation.  
It is retained here for reference and documentation purposes.


This guide is designed so the demo can be executed **step-by-step with zero guessing**.

---

## 🎯 Demo Goal (What We’re Proving)

Show that the backend can:

- Reset the DB to a known baseline (`npm run db:smoke`)
- Read from DB (`GET /api/games`)
- Write to DB (`POST /api/games`)
- Read again to confirm persistence (`GET /api/games`)

**Expected visible results:**
- After reset: **1 row**
- After POST: **2 rows**

**Demo URL (from `.env.example`):**
- Base URL: `http://localhost:3000`
- Endpoint: `http://localhost:3000/api/games`

---

# ✅ A) Before Class (Prep Checklist)

## 1) Open the project folder

1. Open **Terminal** (Mac) or **PowerShell / Command Prompt** (Windows). You can also open terminal or powershell in **VS Code**.
2. Navigate to your project directory:

```bash
cd path/to/term-project
```

## 2) Confirm you are on the `m5` branch

```bash
git branch
```

✅ You should see `m5` with a `*` next to it.

If not:

```bash
git checkout m5
```

Pull latest:

```bash
git pull
```

## 3) Install dependencies (exact versions)

```bash
npm ci
```

✅ This should finish without errors.

## 4) Confirm `.env` exists and has `DATABASE_URL`

List files (including hidden files):

```bash
ls -a
```

If `.env` does **not** exist:

```bash
cp .env.example .env
```

Open `.env` (VS Code recommended):

```bash
code .env
```

Confirm it contains:

```
DATABASE_URL=postgres://localhost:5432/term_project_dev
```

⚠️ **Never commit `.env`.**

## 5) Make sure PostgreSQL is running

- **Mac:** Postgres usually runs automatically after install
- **Windows:** Open **pgAdmin** OR verify the PostgreSQL service is running (Services app)

---

# ✅ B) LIVE DEMO START HERE (60 seconds)

This section includes **exact actions** and **exact narration**.

## Step 0 — Reset DB Baseline (5–10s)

### Do (Terminal, project root)
```bash
npm run db:smoke
```

### Say
> “Before starting, we reset the database using our smoke script.  
> This drops and recreates the `games` table and inserts one seeded row, so the demo always starts from a clean baseline.”

## Step 1 — Start Server (5–10s)

### Do (Terminal)
```bash
npm run dev
```

Leave this terminal running.

### Say
> “Now we start the Express server on port 3000, connected to PostgreSQL through pg-promise.”

## Step 2 — GET baseline row (10–15s)

### Do (Browser)
Open:
- `http://localhost:3000/api/games`

### Say (as you load the page)
> “Here we call our GET endpoint at `/api/games`.”

### Say (once JSON appears)
> “We see exactly one row — the seeded game created by the smoke reset.  
> This confirms our backend can successfully read from PostgreSQL.”

(Brief pause so they can see the JSON.)

## Step 3 — POST a new game (10–15s)

### Do (NEW Terminal window/tab)
Run:
```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{"name":"Hearts Match - Round 2","status":"created"}'
```

### Say
> “Next we insert a new game using POST, sending a JSON body with a name and status.  
> The server responds successfully, confirming the write operation.”

## Step 4 — GET again to confirm persistence (10–15s)

### Do (Browser)
Refresh:
- `http://localhost:3000/api/games`

### Say
> “After inserting, we call GET again and now we see two rows — the seeded baseline row and the new row we just created.  
> This confirms the data persisted in PostgreSQL.”

## Closing (5–10s)

### Say
> “So for Milestone 5, we demonstrated a working PostgreSQL integration with a reliable reset script and functioning GET and POST endpoints for database read and write.”

---

# ✅ C) Troubleshooting / Recovery (Fast)

## If you see too many rows or confusing data
Reset baseline instantly:

```bash
npm run db:smoke
```

Then repeat the demo from **Step 2**.

## If POST returns 400 Bad Request
- Make sure your JSON includes **both** `name` and `status`.

## If the server won’t start or shows DB errors
- Confirm `.env` has the correct `DATABASE_URL`
- Confirm PostgreSQL is running
- Confirm the database exists:

```bash
psql -l
```

---

# ✅ Final Demo Checklist (No Surprises)

- [ ] `npm run db:smoke` works
- [ ] `npm run dev` starts server on port 3000
- [ ] Browser GET `/api/games` shows **1 seeded row**
- [ ] curl POST `/api/games` succeeds
- [ ] Browser GET `/api/games` shows **2 rows**
- [ ] You can recover quickly by re-running `npm run db:smoke`