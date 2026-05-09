# M10 State

Purpose: current project status snapshot for future Codex sessions.

Last initialized: 2026-05-09.

## Current Branch And Git Status

- Current branch verified before creating these memory files: `m10`.
- `git status --short --branch` showed `## m10...origin/m10`.
- Working tree was clean before creating `docs/milestones/m10/`.
- `docs/milestones/m10/` did not exist before this initialization.

## Completed Work

- Project is an Express + TypeScript + EJS app for Team Hearts.
- PostgreSQL connection exists in `src/db/connection.ts` and reads `DATABASE_URL`.
- Auth routes support register, login, logout flow and redirect authenticated users to `/lobby`.
- Sessions are stored in PostgreSQL through `connect-pg-simple`.
- Existing migrations create:
  - `users`
  - `session`
  - case-insensitive unique email index
  - `games`
  - `game_users`
- Existing lobby route renders `views/lobby.ejs` for authenticated users.
- Existing lobby frontend in `src/client/lobby.ts`:
  - loads games with `fetch("/api/games")`
  - creates games with `fetch("/api/games", { method: "POST" })`
  - listens for SSE updates with `EventSource("/api/sse")`
  - renders game list updates into `#games-list`
- Existing SSE route in `src/routes/sse.ts` stores connected clients in memory and broadcasts JSON messages.
- Existing game routes:
  - `GET /api/games` returns games as JSON
  - `POST /api/games` creates a game for the session user and broadcasts `games_updated`
  - `GET /games/:id` renders a placeholder game page
- `npm run build` currently runs TypeScript compile and then client bundling.
- `public/js/lobby.js` and `public/js/lobby.js.map` are tracked in the repository.

## Current Render Status

- Render dashboard status was not verified from the local workspace.
- No `render.yaml` file is currently present in the repository.
- Current plan is to configure deployment through Render dashboard settings.
- Render should use Render-managed environment variables rather than committed secrets.
- Required env vars for the current app include:
  - `DATABASE_URL`
  - `SESSION_SECRET`
  - `PORT` is provided by Render and the app already reads it.
- Render Postgres is the planned production database.
- Database migrations must be run against the Render Postgres database before expecting the deployed app to work.

## Current Database Status

- Local database contents were not queried during this memory-file initialization.
- Database schema in the repo is represented by the existing `migrations/` directory.
- Current app state is relational:
  - `games` stores game row and status.
  - `game_users` stores users joined to games.
  - `users` stores account data.
  - `session` stores Express session data.
- `games.status` currently allows `waiting`, `in_progress`, and `finished`.
- `game_users` currently has `game_id`, `user_id`, and `joined_at`.
- There is currently no dedicated full Hearts schema for cards, hands, tricks, passing, or scoring in active migrations.
- There should be no JSON game-state column for M10.

## Current Build And Deploy Commands

Local development:

```bash
npm install
cp .env.example .env
npm run dev
```

Build and start:

```bash
npm run build
npm start
```

Database migrations:

```bash
npm run migrate:up
npm run migrate:down
```

Local database utility scripts:

```bash
npm run db:recreate
npm run db:clear
npm run db:check:empty
npm run db:clear:check
```

Likely Render settings:

```bash
Build Command: npm ci && npm run build
Start Command: npm start
```

Migration command for Render Postgres, run intentionally against the Render database:

```bash
npm run migrate:up
```

## Current M10 Database Plan

- Use Render Postgres for deployed persistence.
- Keep game/lobby state relational and server-authoritative.
- Keep M10 schema minimal.
- Start from the existing `games` and `game_users` tables.
- If queue behavior needs more structure, add only the smallest needed relational fields or tables.
- Prefer new additive migrations for M10 changes; do not rewrite existing migrations unless the team explicitly decides to reset history.
- Possible M10-safe database additions, if needed later:
  - seat/order field on `game_users`
  - status constraint updates only if the current statuses are insufficient
  - timestamps needed for waiting/started state
- Do not add card, trick, pass, score, bot, or full engine tables for M10 unless the scope changes.

## Current Lobby Plan

- Move from a manual "Create Game" mental model to a queue-style lobby.
- User-facing primary action should be "Play Hearts".
- Server handles the queue:
  - authenticate the session user
  - find a waiting game with fewer than four players
  - join that game if the user is not already in it
  - create a waiting game if no joinable game exists
  - cap each game at four players
  - return the server-selected game
- Client should use `fetch` for the Play Hearts action.
- Client should keep using SSE for updates after the server changes lobby state.
- The game page can remain a simple waiting/table page for M10.

## Known Blockers And Risks

- Render status is unknown from the repo alone.
- Render env vars must be configured outside Git.
- Render Postgres migrations may not be applied yet.
- The app currently starts livereload middleware unconditionally; verify production behavior on Render before demo.
- SSE broadcasts are currently in-memory per server process. This is acceptable for a single Render instance but will not fan out across multiple instances.
- Render database SSL behavior may need verification depending on whether the app connects through internal or external database URL.
- The current lobby button text is "Create Game"; M10 decision says use "Play Hearts" later.
- Existing game page is a placeholder and does not yet read player/game state from the database.

## Immediate Next Steps

1. Verify Render service and Render Postgres exist in the dashboard.
2. Confirm `DATABASE_URL` and `SESSION_SECRET` are set in Render.
3. Run or configure migrations against Render Postgres.
4. Plan the minimal queue-style lobby implementation before editing app code.
5. If app code changes are approved, update server action, lobby UI/client, and any minimal migration needed.
6. Run `npm run build` and any relevant migration checks.
7. Append a detailed log entry to `m10-codex-context.md` after each meaningful work session.
8. Update this state file when branch status, Render status, database status, or immediate next steps change.
