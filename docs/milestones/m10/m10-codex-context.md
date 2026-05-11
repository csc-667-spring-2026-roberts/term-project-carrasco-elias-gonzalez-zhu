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

## 2026-05-09 - Production Start Command Analysis

The user asked for analysis only and explicitly said not to modify any files. The requested task was to determine the correct command to start the production server. The user required the current Git branch to be verified first, with instructions to stop if the branch was not `m10` and not to switch branches automatically.

Branch verification:

- Command run: `git branch --show-current`
- Result: `m10`
- Because the current branch was `m10`, the analysis continued.

Files and references inspected:

- `package.json`
- `src/server.ts`
- `dist/server.js`
- `tsconfig.json`
- `README.md`
- `docs/milestones/m10/` memory files
- Other documentation references found through `rg`

Commands used for read-only analysis:

- `sed -n '1,120p' package.json`
- `sed -n '1,140p' src/server.ts`
- `rg -n "npm run dev|npm run build|npm start|start command|Start Command|Build Command|dist/server\\.js|src/server\\.ts|production|Render|PORT|server" README.md docs package.json src`
- `test -f dist/server.js && sed -n '1,80p' dist/server.js || true`
- `rg --files docs/milestones/m10`
- `sed -n '1,180p' tsconfig.json`
- `sed -n '1,220p' docs/milestones/m10/m10-log-command.md`
- `find dist -maxdepth 2 -type f -print`
- `git status --short --untracked-files=all`

Findings from `package.json`:

- `"main"` is `dist/server.js`.
- `npm run build` runs `tsc && npm run build:client`.
- `npm run build:client` runs `esbuild src/client/lobby.ts --bundle --outdir=public/js --sourcemap`.
- `npm start` runs `node dist/server.js`.
- `npm run dev` runs both the server watcher and client watcher through `concurrently`.
- `npm run dev:server` runs `tsx watch src/server.ts`.
- `npm run dev:client` runs the esbuild watch command for `src/client/lobby.ts`.

Findings from `src/server.ts`:

- Source server entry point is `src/server.ts`.
- The server imports `dotenv/config`.
- The server reads `PORT` with `Number(process.env.PORT) || 3000`.
- The server requires `SESSION_SECRET`; startup throws `SESSION_SECRET is not set.` if absent.
- The server uses `db` from `src/db/connection.ts`, which requires `DATABASE_URL`.
- Routes mounted include `/`, `/auth`, `/lobby`, `/api/sse`, `/api/games`, and `/games`.
- The server starts with `app.listen(PORT, ...)`.
- There is a comment saying live reload is disabled in production, but the code currently creates the livereload server and installs `connectLivereload()` unconditionally.

Findings from `dist/server.js`:

- `dist/server.js` exists in the local workspace.
- It is the compiled JavaScript output corresponding to `src/server.ts`.
- It imports the compiled route, middleware, and database modules from `dist/`.
- It starts the same Express server and reads `PORT`.

Findings from `tsconfig.json`:

- `outDir` is `./dist`.
- `rootDir` is `./src`.
- `include` is `src/**/*`.
- `exclude` includes `node_modules` and `dist`.
- This confirms that TypeScript compilation produces `dist/server.js` from `src/server.ts`.

Answer provided to the user:

- Production start command should be `npm start`, which runs `node dist/server.js`.
- Development command is `npm run dev`.
- The source server entry point is `src/server.ts`.
- The production runtime entry point is `dist/server.js`.
- `npm start` correctly runs the production server if `npm run build` has already produced `dist/server.js`.
- For Render, likely build command remains `npm ci && npm run build`.
- For Render, likely start command is `npm start`.

Potential Render issues identified:

- Render must run a build before `npm start`; otherwise `dist/server.js` may not exist.
- Render must have `DATABASE_URL` and `SESSION_SECRET` configured.
- `PORT` is provided by Render and is already read by the app.
- `npm start` does not run database migrations, so Render Postgres migrations must be handled separately.
- The app currently starts livereload middleware unconditionally, which should be verified before demo/deploy because it may be inappropriate in production.

No files were modified during that analysis interaction. `git status --short --untracked-files=all` returned no output at the end of the analysis, confirming the read-only instruction was honored.

## 2026-05-09 - Development-Only Livereload Guard

The user asked for a focused application-code change to `server.ts` and explicitly said not to modify anything else. The requested task was to update `server.ts` so livereload only runs in development. The user specified the implementation shape: find where `livereload` and `connect-livereload` are used, wrap them in `if (process.env.NODE_ENV !== "production")`, do not change any other logic, and do not affect production behavior except disabling livereload. The user also asked for the updated section only after editing.

Branch and file inspection:

- Command run: `git branch --show-current`
- Result: `m10`
- Command run: `sed -n '1,90p' src/server.ts`
- Purpose: inspect the current imports and middleware setup around livereload before editing.

Original relevant `src/server.ts` behavior:

- `livereload` was imported from `"livereload"`.
- `connectLivereload` was imported from `"connect-livereload"`.
- The code created a livereload server unconditionally with `livereload.createServer()`.
- The code watched `../public` and `../views` unconditionally.
- The code installed `connectLivereload()` unconditionally with `app.use(connectLivereload())`.
- There was already a comment saying live reload was disabled in production, but the actual code did not enforce that.

Change made:

- Only `src/server.ts` was edited.
- The existing livereload setup block was wrapped in:

```ts
if (process.env.NODE_ENV !== "production") {
  // existing livereload setup
}
```

- No route mounting, session setup, static middleware, request logging, env loading, imports, or database logic was changed.
- The existing eslint-disable comments were preserved and moved inside the guard with the code they describe.
- The change keeps livereload behavior for development and disables livereload when `NODE_ENV` is exactly `"production"`.

Updated section shown to the user:

```ts
if (process.env.NODE_ENV !== "production") {
  // Enable live reload in development (disabled in production)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const liveReloadServer = livereload.createServer();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  liveReloadServer.watch([path.join(__dirname, "../public"), path.join(__dirname, "../views")]);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(connectLivereload());
}
```

Verification performed:

- Command run after editing: `sed -n '30,52p' src/server.ts`
- Purpose: read back the updated section only.
- No build, lint, or runtime command was run during that interaction because the user asked for a narrow edit and the updated section only.

Reasoning and deployment impact:

- This directly addresses the previously identified Render risk where livereload middleware started unconditionally in production.
- Production behavior changes only by skipping livereload setup when `NODE_ENV=production`.
- Development behavior remains the same when `NODE_ENV` is unset or not `"production"`, which matches the existing local dev workflow.
- Render must set `NODE_ENV=production` for this guard to disable livereload in deployment; many Node deployment environments do this, but it should still be verified in Render settings/logs.

## 2026-05-10 - Render Environment File Templates

The user asked for Render-specific environment files and a `.gitignore` update. The instruction was not to modify application source code, not to expose real secrets or database URLs, and to create or update only `.env.example.render`, `.env.render`, and `.gitignore`. The user specifically wanted placeholder values only in `.env.render`.

Branch verification:

- Command run: `git branch --show-current`
- Result: `m10`
- Because the current branch was `m10`, work continued.

Read-only inspection before editing:

- Checked whether `.env.example.render` and `.env.render` already existed.
- Read the `.gitignore` environment section.
- Confirmed the existing ignore pattern already ignored `.env` and `.env.*`, allowed `.env.example`, and did not yet explicitly allow `.env.example.render`.
- Did not print or inspect real secret values from `.env`.

Files created:

- `.env.example.render`
- `.env.render`

`.env.example.render` was created as the committed Render example template with comments and placeholder values only:

```bash
# Render environment example (DO NOT COMMIT REAL VALUES)
# Copy this file to .env.render and fill in real values from Render DB.

DATABASE_URL=<Render External Database URL>
NODE_ENV=production
SESSION_SECRET=<generated secret>
```

`.env.render` was created as a local-only placeholder file:

```bash
DATABASE_URL=<Render External Database URL>
NODE_ENV=production
SESSION_SECRET=<generated secret>
```

No real Render database URL, internal database URL, external database URL, or session secret was written to either file. The placeholder `.env.render` exists so a developer can later fill it locally when they need to run commands from a laptop against the Render External Database URL. It should remain ignored and should never be committed.

`.gitignore` was updated only in the environment section. The final intended section is:

```gitignore
# Environment
.env
.env.*
!.env.example
!.env.example.render
```

Reasoning and tradeoffs:

- `.env.example.render` should be tracked because it documents the Render-oriented variables without exposing secrets.
- `.env.render` should remain ignored because it can contain the Render External Database URL and a generated `SESSION_SECRET` for local command usage.
- The Render dashboard remains the source of truth for deployed service variables.
- In the Render dashboard, `DATABASE_URL` should use the Render Internal Database URL.
- In a local `.env.render`, `DATABASE_URL` should use the Render External Database URL if a developer intentionally runs a local command against Render Postgres.
- The existing `.env.*` ignore rule already protects `.env.render`; adding `!.env.example.render` creates the one explicit exception needed for the example file.
- This change does not add any database scripts and does not make local commands automatically load `.env.render`; it only creates a safe file convention for future Render-specific workflows.

Post-edit verification:

- Read back the created `.env.example.render` content.
- Read back the created `.env.render` content and confirmed it contained placeholders only.
- Read back the `.gitignore` environment section.
- Checked Git status.

Git status after the interaction showed:

- `.gitignore` modified.
- `.env.example.render` untracked and available to commit.
- `.env.render` not listed because it is ignored by `.env.*`.
- Pre-existing modified files were still present, including M10 memory docs, `src/server.ts`, and several root config/example files. Those unrelated changes were not reverted or edited during this interaction.

No application code, `package.json`, migrations, or database helper scripts were modified in this interaction.

## 2026-05-10 - Render Database Utility Script Variants

The user asked to create Render-specific versions of the existing database utility scripts in `package.json`. The instruction was not to modify application code, not to modify or remove the existing scripts, and to add new scripts only. The user explicitly said not to add confirmation guards yet, not to change the SQL statements, not to modify `.env` or `.env.render`, and not to modify any other files. The requested output was the updated `package.json` scripts section only.

Branch verification:

- Command run: `git branch --show-current`
- Result: `m10`
- Because the current branch was `m10`, work continued.

Original local database scripts in `package.json`:

```json
"db:clear": "dotenv -e .env -- sh -c 'psql \"$DATABASE_URL\" -c \"TRUNCATE session, users, games, game_users RESTART IDENTITY CASCADE;\"'",
"db:check:empty": "dotenv -e .env -- sh -c 'psql \"$DATABASE_URL\" -c \"SELECT COUNT(*) AS users_count FROM users; SELECT COUNT(*) AS session_count FROM session; SELECT COUNT(*) AS games_count FROM games; SELECT COUNT(*) AS game_users_count FROM game_users;\"'",
"db:clear:check": "npm run db:clear && npm run db:check:empty"
```

The requested Render variants were:

- `db:clear:render`
- `db:check:empty:render`
- `db:clear:check:render`

Change made:

- Only `package.json` was edited.
- Existing scripts were left unchanged.
- New scripts were inserted immediately after the existing local `db:clear`, `db:check:empty`, and `db:clear:check` scripts.
- The SQL statements were copied exactly from the local scripts.
- The only database-targeting difference is that the Render variants load `.env.render` instead of `.env`.
- No confirmation prompts or guardrails were added, per user instruction.
- `.env` and `.env.render` were not modified.
- No application source code, migrations, or database helper TypeScript files were modified.

New scripts added:

```json
"db:clear:render": "dotenv -e .env.render -- sh -c 'psql \"$DATABASE_URL\" -c \"TRUNCATE session, users, games, game_users RESTART IDENTITY CASCADE;\"'",
"db:check:empty:render": "dotenv -e .env.render -- sh -c 'psql \"$DATABASE_URL\" -c \"SELECT COUNT(*) AS users_count FROM users; SELECT COUNT(*) AS session_count FROM session; SELECT COUNT(*) AS games_count FROM games; SELECT COUNT(*) AS game_users_count FROM game_users;\"'",
"db:clear:check:render": "npm run db:clear:render && npm run db:check:empty:render"
```

Behavior after the change:

- `npm run db:clear` still loads `.env` and targets the local database configured there.
- `npm run db:check:empty` still loads `.env` and targets the local database configured there.
- `npm run db:clear:check` still runs the two local scripts.
- `npm run db:clear:render` loads `.env.render` and runs the same destructive `TRUNCATE session, users, games, game_users RESTART IDENTITY CASCADE;` SQL against the database in `.env.render`.
- `npm run db:check:empty:render` loads `.env.render` and reads counts from `users`, `session`, `games`, and `game_users`.
- `npm run db:clear:check:render` runs `db:clear:render` and then `db:check:empty:render`.

Important reasoning and tradeoffs:

- This preserves the existing local workflow while adding an explicit `:render` suffix convention for commands that intentionally target the Render database from a local machine.
- The new scripts are intentionally parallel to the existing scripts so the team can reason about them easily.
- These scripts still depend on `dotenv-cli`, `sh`, and `psql`, so they inherit the existing cross-platform limitations, especially on Windows.
- The Render clear script is destructive because it truncates `session`, `users`, `games`, and `game_users` and resets identities.
- There are no confirmation guards yet because the user explicitly requested not to add them in this interaction.
- Future work should consider replacing shell one-liners with TypeScript helpers and adding explicit Render confirmation prompts or target checks before using destructive Render operations.

Verification performed:

- Read back the updated scripts section with `sed -n '7,34p' package.json`.
- Confirmed the new scripts appeared with the `:render` suffix.
- Confirmed the existing local scripts remained unchanged.

The assistant response showed only the updated `package.json` scripts section, as requested.

## 2026-05-10 - Render Free Performance Diagnostics And Tuning

The user asked to implement minimal M10-safe performance diagnostics and fixes for slow Render behavior. The context was that the deployed Render Free app was very slow after login/navigation, registration/login might be slow because of bcrypt rounds, and normal navigation might be slow because of PostgreSQL-backed session touches and SSE reconnect/session pressure. The user explicitly said not to disable SSE permanently, not to modify unrelated files, not to modify migrations, not to modify database scripts, not to modify `package.json` unless truly necessary, not to add dependencies, and not to print secrets or database URLs.

Branch verification:

- Command run: `git branch --show-current`
- Result: `m10`
- Because the current branch was `m10`, work continued.

Files inspected before editing:

- `tsconfig.json`
- `src/server.ts`
- `src/routes/auth.ts`
- `src/routes/sse.ts`
- `src/middleware/logging.ts`

Required changes from the user:

1. Make bcrypt rounds configurable in `src/routes/auth.ts` using `Number(process.env.BCRYPT_ROUNDS) || 10`, while keeping default `10`.
2. Add request duration logging in `src/server.ts` with method, URL, status code, and duration in milliseconds, while keeping SSE logs understandable.
3. Add `disableTouch: true` to the `connect-pg-simple` session store configuration to reduce session-store writes.
4. Add SSE diagnostics in `src/routes/sse.ts` for client connect/disconnect events and active client count, without disabling SSE or changing broadcast behavior.
5. Report that Render should add `BCRYPT_ROUNDS=8`.

Changes made:

- Edited `src/routes/auth.ts`.
- Edited `src/server.ts`.
- Edited `src/routes/sse.ts`.
- Did not edit migrations.
- Did not edit database scripts.
- Did not edit `package.json`.
- Did not add dependencies.
- Did not print or inspect secrets or database URLs.

Auth change:

The hardcoded bcrypt rounds constant:

```ts
const BCRYPT_ROUNDS = 10;
```

was replaced with:

```ts
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
```

Reasoning:

- Default behavior remains rounds `10` if no env var is set.
- Render Free can set `BCRYPT_ROUNDS=8` to reduce registration time for the M10 demo.
- Registration still awaits `bcrypt.hash(passwordRaw, BCRYPT_ROUNDS)` before inserting a user.
- Login still uses `bcrypt.compare(passwordRaw, row.password_hash)`.
- Existing user hashes keep their embedded cost factor, so users created with rounds `10` may still compare at cost `10` even after future registrations use rounds `8`.

Request logging change:

- Removed the old `requestLogger` import from `src/server.ts`.
- Replaced the old one-line request logger middleware with inline duration logging after static middleware and before session middleware.
- The new logger records:
  - HTTP method
  - `request.originalUrl`
  - final `response.statusCode`
  - request duration in milliseconds
  - `closed` suffix when a connection closes before `response.writableEnded`

The new log format is intended to look like:

```text
GET /lobby 200 42ms
GET /api/games 200 80ms
GET /api/sse 200 300000ms closed
```

Reasoning:

- Normal requests now have enough timing data to distinguish slow route handling from fast responses.
- Long-lived SSE requests should be less confusing because they only finish when the stream closes and the close case is labeled.
- The logger stays simple and M10-safe.

Session-store change:

The `connect-pg-simple` session store config in `src/server.ts` now includes:

```ts
disableTouch: true,
```

under:

```ts
store: new PgSessionStore({
  pgPromise: db,
  tableName: "session",
  disableTouch: true,
}),
```

Reasoning:

- `connect-pg-simple` can touch/update session expiration on otherwise read-only requests.
- Render Free normal navigation was suspected to be slow partly because every dynamic request, including `/`, `/lobby`, `/api/games`, and `/api/sse`, passes through PostgreSQL-backed session middleware.
- `disableTouch: true` reduces session-store writes for unchanged sessions while preserving session reads and actual session set/update behavior.
- Session table name and general session behavior were not changed.

SSE diagnostics change:

`src/routes/sse.ts` now logs when an SSE client connects:

```ts
console.log(`SSE client ${String(clientId)} connected. Active clients: ${String(clients.size)}`);
```

and logs when it disconnects:

```ts
console.log(`SSE client ${String(clientId)} disconnected. Active clients: ${String(clients.size)}`);
```

Reasoning:

- The deployed app had logs showing `GET /api/sse`.
- `/api/sse` intentionally keeps an HTTP connection open.
- Active client counts help reveal whether EventSource reconnects or multiple open tabs are creating pressure on the single Render Free process.
- Broadcast behavior stayed the same; `broadcastSse` still serializes the payload as `data: ...\n\n` and writes it to all stored client responses.
- SSE was not disabled.

Verification performed:

- Command run: `npx tsc --noEmit`
- Result: passed with exit code `0`.
- Command run: `npm run lint`
- Result: passed with exit code `0`.

Additional readback:

- Read back `src/server.ts`.
- Read back `src/routes/auth.ts`.
- Read back `src/routes/sse.ts`.
- Checked `git status --short --untracked-files=all`.

Git status after the interaction showed existing modified files plus the three newly changed source files:

- `src/routes/auth.ts`
- `src/routes/sse.ts`
- `src/server.ts`

There were also pre-existing modified files from earlier M10 work, including root config files, M10 memory docs, `package.json`, and `.env.example.render`.

The assistant response summarized the changed files, explained each change, reported that `npx tsc --noEmit` and `npm run lint` passed, reminded the user to add `BCRYPT_ROUNDS=8` in Render for the Free-tier demo, and suggested local verification commands:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

`npm run build` and `npm run dev` were suggested but not run during that interaction.
