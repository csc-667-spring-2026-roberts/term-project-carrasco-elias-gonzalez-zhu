# M10 Decisions

Purpose: durable architecture and product decisions for M10.

## Active Decisions

### Queue-Style Lobby

Decision: M10 should use a queue-style lobby.

Users should not need to understand or manage game creation directly. The server should place an authenticated user into an available waiting game or create a waiting game when none exists.

Rationale: This keeps the M10 user flow simple, demo-friendly, and server-authoritative.

### Play Hearts Button

Decision: The primary lobby action should be labeled "Play Hearts".

Rationale: "Play Hearts" is clearer for users than "Create Game" and matches the queue-style lobby model.

Implementation note: The existing DOM id `#create-game` may remain temporarily if changing it would require broader frontend rewiring, but future UI should present the action as Play Hearts.

### Render Postgres

Decision: Deployed persistence should use Render Postgres.

Rationale: The project already uses PostgreSQL locally through `DATABASE_URL`, and Render Postgres fits the M10 deployment target.

Implementation note: Run migrations against the Render Postgres database before testing the deployed app.

### Build Script Includes Client Build

Decision: Keep `npm run build` responsible for both server TypeScript compilation and client bundle generation.

Current command:

```bash
npm run build
```

Current script behavior:

```bash
tsc && npm run build:client
```

Rationale: Render can use one build command and still produce the `public/js/lobby.js` asset needed by the EJS lobby page.

### Production Start Command

Decision: Use `npm start` as the production start command after a successful build.

Current command:

```bash
npm start
```

Current script behavior:

```bash
node dist/server.js
```

Rationale: `src/server.ts` compiles to `dist/server.js`, `package.json` declares `dist/server.js` as the main entry, and the existing start script runs the compiled server directly.

Implementation note: `npm start` assumes `npm run build` has already produced `dist/server.js`; it does not run database migrations.

### Development-Only Livereload

Decision: Livereload should run only outside production.

Current guard:

```ts
if (process.env.NODE_ENV !== "production")
```

Rationale: The app should not start the livereload server or inject livereload middleware in production, including Render deployments.

Implementation note: Render should run with `NODE_ENV=production` so the guard disables livereload during production startup.

### M10 Minimal Schema

Decision: Use a minimal schema for M10.

Current foundation:

- `games`
- `game_users`
- `users`
- `session`

Rationale: M10 should prove persistence and a server-authoritative lobby/game entry flow without creating the full Hearts data model.

### No Full Hearts Rules Yet

Decision: Do not implement full Hearts rules for M10.

Out of scope:

- tricks
- passing
- scoring
- bots
- full card/deck engine
- full turn enforcement

Rationale: These features can wait for a later milestone or explicit scope change. M10 should stay small enough to deploy and verify reliably.

### Keep `public/js` Tracked For M10

Decision: Keep generated `public/js/lobby.js` and `public/js/lobby.js.map` tracked for M10.

Rationale: The current repo already tracks the built client asset, and the EJS lobby page depends on `/js/lobby.js`.

Implementation note: If `src/client/lobby.ts` changes in future M10 work, rebuild the client bundle and include the generated asset changes unless the team explicitly changes this decision.

### Use Render Env Vars

Decision: Use Render environment variables for deployment configuration.

Required:

- `DATABASE_URL`
- `SESSION_SECRET`

Expected:

- `PORT` is provided by Render and already read by the app.

Rationale: Secrets and deployment-specific values must not be committed to Git.

### Render Env File Templates

Decision: Track `.env.example.render` with placeholders only and keep `.env.render` ignored/local-only.

Rationale: The team needs a safe template for Render-related variables without risking committed database URLs or session secrets.

Implementation note: Render dashboard variables should use the Render Internal Database URL for the deployed web service. A local `.env.render`, if filled in later, should use the Render External Database URL for intentional local commands against Render Postgres.

### Render Database Script Variants

Decision: Keep the existing local database utility scripts unchanged and add separate `:render` variants for commands that intentionally load `.env.render`.

Current Render variants:

- `db:clear:render`
- `db:check:empty:render`
- `db:clear:check:render`

Rationale: Separate names make the target database explicit and preserve the existing local workflow.

Implementation note: The current Render variants intentionally mirror the existing shell/`psql` commands and do not yet include confirmation guards. Treat clear commands as destructive until safer guarded helpers are added.

### Render Free Performance Tuning

Decision: Keep M10 performance fixes minimal and deployment-safe by using env-configurable bcrypt rounds, request-duration logging, reduced session touch writes, and SSE diagnostics.

Current choices:

- `BCRYPT_ROUNDS` defaults to `10`.
- Render Free demo should use `BCRYPT_ROUNDS=8`.
- `connect-pg-simple` uses `disableTouch: true`.
- Request logs include method, URL, status code, and duration in milliseconds.
- SSE logs include connect/disconnect events and active client count.
- SSE remains enabled.

Rationale: Render Free can be CPU- and connection-constrained, but M10 still needs authenticated lobby navigation and SSE updates. These changes improve observability and reduce avoidable session-store writes without changing product behavior.

Implementation note: Lower bcrypt rounds are a demo performance tradeoff. Revisit after M10 if the app needs stronger production password hashing or more detailed instrumentation.

## Revisit Triggers

Revisit these decisions only if:

- The instructor requires a fuller Hearts implementation for M10.
- Render deployment constraints force a different build or database approach.
- The team decides to stop tracking generated frontend assets.
- The queue model proves incompatible with the milestone rubric.
- Multi-instance deployment becomes required, which would affect in-memory SSE broadcasting.
