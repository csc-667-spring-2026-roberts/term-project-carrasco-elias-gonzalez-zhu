# M5 (Local Setup Guide)

**CSC 667 Term Project**\
**Milestone: M5 (Database Integration)**

This guide outlines what each team member must do for M5.

⚠️ Before proceeding, ensure you have completed all steps in:\
`docs/milestones/m4/m4-local-setup.md`

**Jonathan** should instead follow **[# M5 Jonathan Backend Checklist](m5-jonathan-backend-checklist.md)**

------------------------------------------------------------------------

# PART A --- Required Now (Before DB Integration Is Merged)

These steps must be completed by all team members immediately.

## 0) Switch to the M5 Branch

``` bash
git checkout m5
git pull
npm ci
```

## 1) Install PostgreSQL (Required)

Install PostgreSQL locally by following **[M5 PostgreSQL Installation Guide](m5-postgresql-installation.md)**

## 2) Create Local Development Database

Create a local database:

``` bash
createdb term_project_dev
```

Verify it exists:

``` bash
psql -d term_project_dev
```

Exit:

``` bash
\q
```

------------------------------------------------------------------------

# PART B --- After Jonathan Merges Database Integration

Only complete these steps once DB integration has been pushed to `m5`.

## 3) Configure Environment Variable

If `.env` does NOT exist:

``` bash
cp .env.example .env
```

Open `.env` and confirm it contains:

    DATABASE_URL=postgres://localhost:5432/term_project_dev

If `.env` already exists, ensure the `DATABASE_URL` value matches the above.

⚠️ `.env` must NOT be committed. It is already in `.gitignore`.

## 4) Run Database Schema

``` bash
npm run db:smoke
```

This will drop and recreate the minimal `games` table used for demo.

If you see an error about `db:smoke` not existing, confirm you are on
the `m5` branch.

------------------------------------------------------------------------

## 5) Verify Demo Endpoints

Start server:

``` bash
npm run dev
```

Test:

-   POST → `/api/games`
-   GET → `/api/games`

Confirm:

-   A row is inserted into the database
-   JSON is returned correctly

------------------------------------------------------------------------

# M5 Sanity Checklist

-   On `m5` branch
-   `npm ci` completed successfully
-   PostgreSQL installed locally
-   `psql --version` screenshot submitted
-   Local database (`term_project_dev`) created
-   `.env` contains correct `DATABASE_URL`
-   `npm run db:smoke` executes successfully
-   Demo endpoints return valid JSON