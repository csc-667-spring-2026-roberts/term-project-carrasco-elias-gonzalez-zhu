# M10 Codex Context

Purpose: append-only detailed engineering history for M10. Future sessions should read this file after `m10-agent-instructions.md`, then append a new dated entry instead of rewriting older history.

## 2026-05-09 - Initial M10 Memory Setup

The user requested persistent M10 agent-memory files under `docs/milestones/m10/` and explicitly said not to modify application code. The current branch was verified first with `git branch --show-current`; it returned `m10`, so work continued. `git status --short --branch` then showed `## m10...origin/m10` with no short-status entries before the memory files were created. The folder `docs/milestones/m10/` did not exist at initialization time.

Current repository context:

- The project is Team Hearts for CSC 667 Spring 2026.
- The app is an Express, TypeScript, EJS, PostgreSQL app.
- `src/server.ts` wires home, auth, lobby, games, and SSE routes.
- `src/db/connection.ts` initializes `pg-promise` from `DATABASE_URL`.
- Auth and session support already exist, with session storage through `connect-pg-simple`.
- `src/db/games.ts` creates a game and inserts the creator into `game_users` in a transaction.
- `src/db/games.ts` lists games with creator email and player count for the lobby.
- `src/routes/games.ts` exposes `GET /api/games`, `POST /api/games`, and `GET /games/:id`.
- `src/routes/sse.ts` supports authenticated SSE clients and a `broadcastSse` helper.
- `src/client/lobby.ts` currently uses fetch for `/api/games`, listens to `/api/sse`, renders games into `#games-list`, and navigates joins to `/games/:id`.
- `views/lobby.ejs` currently has a `Create Game` button with id `#create-game`, plus templates for game rows, empty state, and error state.
- `views/game.ejs` is a placeholder table/waiting page.
- `package.json` has `build` set to `tsc && npm run build:client`.
- `build:client` bundles `src/client/lobby.ts` into `public/js` with esbuild.
- `public/js/lobby.js` and `public/js/lobby.js.map` are tracked.

Current schema context:

- Existing migrations create `users`, `session`, case-insensitive unique email, `games`, and `game_users`.
- `games` currently has `id`, `status`, and `created_at`, with allowed statuses `waiting`, `in_progress`, and `finished`.
- `game_users` currently has `game_id`, `user_id`, and `joined_at`, with `(game_id, user_id)` primary key.
- There are no active migrations for Hearts-specific cards, hands, tricks, passing, bots, or scoring.
- M10 guidance is to keep game state relational in PostgreSQL and avoid JSON game-state storage.
- The existing `session.sess` JSON column is only session storage and should not be treated as Hearts game state.

Planning context captured for future M10 work:

- M10 should be minimal and deployment-oriented.
- Use a server-authoritative architecture.
- Use PostgreSQL as the durable source of truth for lobby/game state.
- Use `fetch` for actions and SSE for updates.
- Use Render Postgres for deployment.
- Use Render environment variables for secrets and database connection strings.
- Prefer a queue-style lobby with a user-facing "Play Hearts" button rather than exposing game creation as the primary concept.
- Keep the game page simple for M10.
- Do not implement full Hearts rules, tricks, passing, scoring, bots, or complete game logic unless the team explicitly expands scope.

Render status was not verifiable from local files. There is no `render.yaml` in the repository, so Render configuration is presumed to live in the dashboard. Required app env vars include `DATABASE_URL` and `SESSION_SECRET`; Render provides `PORT`. Migrations must be applied to Render Postgres before the deployed app can rely on the schema.

Important instruction from the user for this session: create only the folder `docs/milestones/m10/` and the five memory Markdown files, with no application-code, `package.json`, migration, or outside-doc edits.
