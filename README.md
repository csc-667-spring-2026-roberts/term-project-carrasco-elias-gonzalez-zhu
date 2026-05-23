# Team Hearts — Hearts

CSC 667 Term Project — Spring 2026

Team Hearts is a multiplayer Hearts web game built with a server-authoritative Express and PostgreSQL architecture. Players can register, join a game, pass cards, play through Hearts hands with server-side rule validation, chat at the table, and finish a game with a final scoreboard.

## Deployed App

https://csc698-capstone-project.onrender.com

## Team Members

| Name | GitHub | Email |
| ---- | ------ | ----- |
| Zoe Elias | @zoebowe | zelias@sfsu.edu |
| Marbella Carrasco | @marbedc | mcarrasco@sfsu.edu |
| Breanna Zhu | @zbreanna | szhu@sfsu.edu |
| Jonathan Gonzalez | @JGonzalez650 | jgonzalez7@sfsu.edu |

## Tech Stack

- Node.js 20+
- Express and TypeScript
- PostgreSQL with `pg-promise`
- `node-pg-migrate` for database migrations
- EJS server-rendered views
- Client TypeScript bundled with ESBuild
- `express-session` with PostgreSQL-backed session storage
- Server-Sent Events (SSE) for realtime game, lobby, and chat updates
- Render for deployment

## Local Setup

Prerequisites:

- Node.js 20 or newer
- PostgreSQL installed and running locally
- A local PostgreSQL database, for example `term_project_dev`

Setup steps:

```bash
npm ci
cp .env.example .env
```

Edit `.env` with local values:

```env
PORT=3000
DATABASE_URL=postgres://localhost:5432/term_project_dev
SESSION_SECRET=change_me
```

Then run migrations and start the development server:

```bash
npm run migrate:up
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

Do not commit `.env`, `.env.render`, database passwords, Render credentials, production database URLs, or real session secrets. Environment files containing real values should remain gitignored.

## Environment Variables

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `PORT` | Local optional / Render provided | Port for the Express server. Local default is usually `3000`; Render provides this automatically. |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by the app and migrations. Use a local database URL for development. |
| `SESSION_SECRET` | Yes | Secret used to sign session cookies. Use a generated secret outside local throwaway development. |
| `BOT_ACTION_DELAY_MS` | Optional | Delay between automated bot actions. Useful for demo readability. |
| `HUMAN_TURN_TIMEOUT_MS` | Optional | Optional inactivity timeout for demo/testing. `0` disables it. |

Normal local values:

```env
PORT=3000
DATABASE_URL=postgres://localhost:5432/term_project_dev
SESSION_SECRET=change_me
```

Optional demo/testing values:

```env
BOT_ACTION_DELAY_MS=1500
HUMAN_TURN_TIMEOUT_MS=15000
```

`BOT_ACTION_DELAY_MS` controls pacing between automated bot actions for demo readability. `HUMAN_TURN_TIMEOUT_MS` enables optional automatic moves for inactive connected players during demos/testing; set it to `0` to disable the timeout.

## Useful Scripts

- `npm run dev` — Start the development server and client watcher.
- `npm run build` — Compile TypeScript and bundle client TypeScript into `public/js`.
- `npm start` — Run the compiled production server from `dist/server.js`.
- `npm run lint` — Check TypeScript source with ESLint.
- `npm run format` — Format source, views, docs, and config files with Prettier.
- `npm run migrate:up` — Apply pending PostgreSQL migrations.
- `npm run db:clear:check` — Clear local development data and verify the local database is empty.

`npm run db:clear:check` is intended for local development cleanup. Do not run destructive database scripts against a shared or production database unless the team intentionally approves it.

## Gameplay Features

- Four-player Hearts table
- Lobby with a single Play Hearts matchmaking action
- Server-authoritative card state stored in PostgreSQL
- Passing rotation
- Follow-suit validation
- Hearts-broken rule enforcement
- Queen of Spades scoring
- Shoot-the-moon scoring
- Game over at the target score with a final scoreboard
- Bots after intentional leave or disconnect timeout
- Optional human inactivity timeout for demos/testing
- SSE realtime synchronization across browsers
- Per-game chat
- User-selected emoji avatars with suit-icon fallback
- Refresh-safe game state loaded from PostgreSQL

## Known Limitations

- Bots are simple rule-following bots and do not use advanced strategy.
- SSE clients, bot pacing timers, and optional human inactivity timers are tracked in server memory.
- There are no private games, invite codes, or separate custom lobbies.
- The UI is optimized for the course demo rather than a polished commercial Hearts product.
- Render free-tier instances may sleep and can have slow first requests after waking.

## Credits and Attribution

- No third-party image assets are used.
- Emoji avatars use standard Unicode emoji.
- Card and table visuals are implemented with HTML, CSS, and text symbols.
