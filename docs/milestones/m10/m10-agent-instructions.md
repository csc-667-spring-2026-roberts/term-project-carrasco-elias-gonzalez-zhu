# M10 Agent Instructions

Purpose: stable rules for future Codex sessions working on CSC 667 M10.

## Scope

CSC 667 M10 should stay focused on a minimal, deployable Hearts project slice:

- The application is Team Hearts, a CSC 667 Spring 2026 term project.
- The app is an Express, TypeScript, EJS, PostgreSQL implementation of a Hearts-themed web app.
- M10 is not the milestone for a complete Hearts rules engine.
- The M10 target is a small server-authoritative flow that can run on Render, persist important state in PostgreSQL, and let authenticated users enter a lobby/game flow.

## Project Context

- Existing app areas include auth, PostgreSQL-backed sessions, a lobby page, game creation/listing endpoints, SSE lobby updates, and a placeholder game page.
- Existing database access uses `pg-promise` through `src/db/connection.ts`.
- Existing migrations are managed with `node-pg-migrate`.
- Existing frontend lobby TypeScript is bundled into `public/js/lobby.js` by `npm run build:client`.
- The current lobby UI uses `fetch` to call actions and `EventSource`/SSE to receive updates.

## Architecture Rules

- Treat the server as authoritative for all game and lobby state.
- Store game state in PostgreSQL.
- Do not store game state as JSON.
- Exception: the existing `session.sess` JSON column is Express session storage, not Hearts game state.
- Use relational tables, columns, constraints, and transactions for M10 game/lobby state.
- Use `fetch` for user actions such as playing, joining, creating, or starting.
- Use SSE for server-pushed updates such as lobby queue changes or game status changes.
- Keep browser state as a view/cache of server state, not as the source of truth.

## M10 Boundaries

Do not overbuild full Hearts rules for M10.

Do not implement these unless the team explicitly changes the M10 scope:

- Tricks
- Passing
- Scoring
- Bots
- Full deck/card dealing logic
- Full turn validation
- Full Hearts game engine behavior

Acceptable M10-safe behavior is intentionally small:

- Authenticated user reaches lobby.
- User clicks a Play Hearts-style action.
- Server finds or creates a waiting game.
- Server records the user in PostgreSQL.
- Lobby/game views reflect the server state.
- SSE broadcasts state changes where useful.
- Game page may remain a simple waiting/table view.

## Change Discipline

- Prefer minimal M10-safe changes.
- Favor the repo's existing patterns over new abstractions.
- Do not modify application code unless explicitly instructed.
- Ask before modifying files unless the user explicitly instructed the exact change.
- When modifying database shape, prefer a new migration over editing existing migrations.
- Do not edit `package.json`, migrations, or application code unless the user explicitly asks.
- Keep `public/js` tracked for M10 because the app currently commits the bundled lobby asset.
- If changing `src/client/lobby.ts` in a future task, run the client build and include the generated `public/js/lobby.js` and map updates if that remains the team decision.

## Verification Expectations

For implementation work in future sessions:

- Verify the current branch first when the user requests branch-specific work.
- Run the smallest relevant checks after changes.
- For app code, expected checks often include `npm run build`, and sometimes `npm run lint` or `npm run format:check`.
- For database work, expected checks often include `npm run migrate:up` against the intended database.
- For Render work, verify required env vars are present in the Render dashboard before assuming deployment health.
