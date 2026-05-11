# M10 State

Purpose: current project status snapshot for future Codex sessions.

Last updated: 2026-05-10.

## Current Branch And Git Status

- Current branch verified during the latest Render database-script work: `m10`.
- Current working tree includes the intentional `src/server.ts` livereload guard change, `.gitignore` environment-rule update, `.env.example.render`, `package.json` Render database script additions, and M10 memory-doc updates.
- `.env.render` exists locally and is ignored by `.env.*`.
- M10 memory files now exist under `docs/milestones/m10/`.

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
- Production start command analysis confirmed `npm start` runs the compiled server with `node dist/server.js`.
- Development command analysis confirmed `npm run dev` runs both the server watcher and client watcher.
- `src/server.ts` now wraps the livereload server, file watcher, and `connectLivereload()` middleware in `if (process.env.NODE_ENV !== "production")`.
- `.env.example.render` now exists as a committed-safe Render environment template with placeholder values only.
- `.env.render` exists locally and remains ignored by Git.
- `.gitignore` now keeps `.env` and `.env.*` ignored while explicitly allowing both `.env.example` and `.env.example.render`.
- `package.json` now includes Render-specific database utility script variants:
  - `db:clear:render`
  - `db:check:empty:render`
  - `db:clear:check:render`
- `public/js/lobby.js` and `public/js/lobby.js.map` are tracked in the repository.

## Current Render Status

- Render dashboard status was not verified from the local workspace.
- No `render.yaml` file is currently present in the repository.
- Current plan is to configure deployment through Render dashboard settings.
- Render should use Render-managed environment variables rather than committed secrets.
- Required Render env vars:
  - `DATABASE_URL=<Render Internal Database URL>`
  - `SESSION_SECRET=<generated secret>`
  - `NODE_ENV=production`
  - `NPM_CONFIG_PRODUCTION=false`
- `PORT` is provided by Render and the app already reads it.
- `DATABASE_URL` should use the Render Internal Database URL.
- Secrets should not be committed to Git.
- Render Postgres is the planned production database.
- Database migrations must be run against the Render Postgres database before expecting the deployed app to work.
- Current production start command for Render should be `npm start` after the Render build command has produced `dist/server.js` and applied migrations.
- Render build command should run migrations with `npm ci && npm run build && npm run migrate:up`.
- The previous unconditional livereload startup risk has been addressed in source by gating livereload behind `NODE_ENV !== "production"`.
- Render should still be checked to confirm `NODE_ENV` is set to `production` during deployment.
- `.env.example.render` is a trackable local template for Render-related variables.
- `.env.render` is local-only and ignored; if used from a developer machine, it should contain the Render External Database URL, not the internal URL.
- Render dashboard environment variables should still use the Render Internal Database URL for the deployed web service.
- Render-specific database utility scripts now exist for intentional local commands against the database configured in `.env.render`; they are not part of the Render deploy command.

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

Production runtime details:

```bash
npm start
# runs: node dist/server.js
```

Development runtime details:

```bash
npm run dev
# runs server watcher: npm run dev:server
# runs client watcher: npm run dev:client
```

Server entry points:

- Source entry point: `src/server.ts`
- Production runtime entry point: `dist/server.js`

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

Render database utility scripts for local machine use with `.env.render`:

```bash
npm run db:clear:render
npm run db:check:empty:render
npm run db:clear:check:render
```

Likely Render settings:

```bash
Build Command: npm ci && npm run build && npm run migrate:up
Start Command: npm start
```

Render environment variables:

```bash
DATABASE_URL=<Render Internal Database URL>
SESSION_SECRET=<generated secret>
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false
```

Notes:

- `PORT` is provided by Render.
- `DATABASE_URL` should use the Render Internal Database URL.
- Secrets should not be committed.
- `.env.example.render` may be committed because it contains placeholders only.
- `.env.render` must remain ignored and should never contain committed real values.
- Standard local database scripts still load `.env`.
- Render database utility scripts with the `:render` suffix explicitly load `.env.render`.

## Current M10 Database Plan

- Use Render Postgres for deployed persistence.
- Keep game/lobby state relational and server-authoritative.
- Keep M10 schema minimal but sufficient for queue entry and relational card state.
- Existing foundation:
  - `users`
  - `session`
  - `games`
  - `game_users`
- Approved M10 additions:
  - `games.max_players`
  - `games.started_at`
  - `games.current_turn_seat`
  - `game_users.seat`
  - `cards` lookup table with 52 cards
  - `game_cards` per-game relational card state table
- `cards` is a lookup table only.
- `game_cards` stores per-game state.
- Card location lifecycle for M10: `deck` -> `hand` -> `played`.
- Do not store game state as JSON.
- Prefer new additive migrations for M10 changes; do not rewrite existing migrations unless the team explicitly decides to reset history.
- Do not implement full Hearts rules yet.
- Do not implement tricks, passing, scoring, bots, or the full Hearts game engine for M10.

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
- `.env.render` must never be committed; keep real Render database URLs and generated secrets out of Git, chat logs, screenshots, and docs.
- `db:clear:render` is destructive and currently has no confirmation guard by request; it truncates `session`, `users`, `games`, and `game_users` with `RESTART IDENTITY CASCADE`.
- The database utility scripts still depend on `sh` and `psql`, so they may not work cleanly on Windows without a compatible shell and PostgreSQL client tools.
- Render Postgres migrations may not be applied yet.
- Render must run `npm ci && npm run build && npm run migrate:up` before `npm start`; otherwise `dist/server.js` may be missing or database schema may be stale.
- Confirm Render runs with `NODE_ENV=production` so the new livereload guard takes effect.
- The livereload guard has not yet been verified with `npm run build` in this logging pass.
- `.env.example` is for local development only.
- `.env.example.render` is a safe placeholder template for local Render-related setup.
- `.env.render` is local-only and should use the Render External Database URL only when a developer intentionally targets Render from a local machine.
- Render environment variables are configured in the Render dashboard.
- `SESSION_SECRET=change-me` must never be used in production.
- Windows `DATABASE_URL` guidance is local-only and should not be used for Render.
- SSE broadcasts are currently in-memory per server process. This is acceptable for a single Render instance but will not fan out across multiple instances.
- Render database SSL behavior may need verification depending on whether the app connects through internal or external database URL.
- The current lobby button text is "Create Game"; M10 decision says use "Play Hearts" later.
- Existing game page is a placeholder and does not yet read player/game state from the database.

## Immediate Next Steps

1. Configure Render Web Service.
2. Set Render env vars:
   - `DATABASE_URL=<Render Internal Database URL>`
   - `SESSION_SECRET=<generated secret>`
   - `NODE_ENV=production`
   - `NPM_CONFIG_PRODUCTION=false`
3. Deploy using `npm ci && npm run build && npm run migrate:up`.
4. Keep Render start command as `npm start`.
5. Verify migrations run on Render Postgres.
6. Verify auth/session works in production.
7. Verify SSE works in production.
8. If local Render DB commands are needed, fill `.env.render` locally with the Render External Database URL and a generated secret without committing it.
9. Use `npm run db:check:empty:render` for Render table counts only after confirming `.env.render` targets the intended Render database.
10. Treat `npm run db:clear:render` and `npm run db:clear:check:render` as destructive demo-reset commands until safer TypeScript helpers and confirmation guards exist.
11. Consider replacing shell database utility scripts with guarded TypeScript helpers for cross-platform support and safer Render target checks.
12. Continue with minimal M10 queue/gameplay implementation after deploy readiness is confirmed.
13. Append a detailed log entry to `m10-codex-context.md` after each meaningful work session.
14. Update this state file when branch status, Render status, database status, or immediate next steps change.
