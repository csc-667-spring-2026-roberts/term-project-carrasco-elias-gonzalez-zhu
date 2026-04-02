# M8 (Work Split — Marbella)

**CSC 667 Term Project**  
**Milestone: M8 (Frontend Tooling + Games API + Lobby)**

Work is divided by layer ownership to enable parallel development.  
Each person owns a set of files and must implement within those boundaries.

👉 **Before proceeding**, ensure you have completed all steps in  
**[M6/M7 Local Setup Guide](../m6-m7/m6-m7-local-setup.md)**

This guide only covers **new work required for M8**.

---

## 📅 Due Dates (Marbella)

### Friday 04/03 (End of Day)

- Pull latest from `m8`
- Complete API implementation
- Open PR → `m8`

### Sunday 04/05 (End of Day)

- Prepare rough demo plan

### Monday 04/06

- Present the project
- Run demo using `main`

**👉 Access the slides and presenter notes here:**  
**[M8 Slides Guide](m8-slides-guide.md)**
**👉 Access the demo guide here:**  
**[M8 Demo Guide](m8-demo-guide.md)**

---

## 🧠 Local Setup

### 1. Create Your Branch

Start from the base branch:

```bash
git checkout m8
git pull origin m8
```

Create your assigned branch:

```bash
git checkout -b m8-api
git push origin m8-api
```

### 2. Install Dependencies

Install all required dependencies:

```bash
npm run setup
```

If your dependencies get into a bad state, run:

```bash
npm run setup:clean
```

### 3. Recreate Your Local Database

Reset your local database to a clean state:

```bash
npm run db:recreate
```

### 4. (Optional) Install SVG Preview Extension

For viewing database diagrams:

- Open VS Code Extensions
- Search: **SVG Preview**
- Install the extension by Simon Siefke

👉 This helps visualize `.svg` diagrams used in docs/guides.

---

## API (`m8-api`)

### Assigned Files

```text
src/routes/games.ts
src/server.ts
```

👉 You are responsible for implementing API routes in `src/routes/games.ts`.  
👉 You may modify `src/server.ts` only to mount the games routes.  
👉 Do NOT modify files outside of your assigned ownership.  
👉 Do NOT modify shared contracts without team agreement.

### Required Files

```text
src/routes/games.ts
src/server.ts
```

👉 These files are required to complete M8 API functionality.

### Main Goal

Your job is to complete the **API layer for games**.

This includes:

- implementing game routes in `src/routes/games.ts`
- connecting those routes to the database layer
- mounting the routes in `src/server.ts`
- returning correct JSON responses

### Shared Contracts (Do Not Modify)

The following files are shared across layers and must remain stable:

- src/db/games.ts
- src/types/types.ts
- src/middleware/auth.ts

The following file may only be modified for the specific purpose listed:

- src/server.ts — route mounting only

👉 Do NOT modify these files or contracts without team agreement.

### API Requirements (`src/routes/games.ts`)

You must implement the following routes in:

```text
src/routes/games.ts
```

#### GET /api/games

- returns all games for the lobby
- response format:

```json
{ games: [...] }
```

#### POST /api/games

- creates a new game
- requires authenticated user
- use:

```text
request.session.user.id
```

- return created game as JSON

### Route Mounting (`src/server.ts`)

You must mount the games routes in:

```text
src/server.ts
```

👉 Look for the TODO comment in that file.  
👉 Your change in `src/server.ts` should only be for connecting the games routes.

### Implementation Notes

For `src/routes/games.ts`:

- Use functions from `src/db/games.ts`
- Do NOT write SQL in routes
- Use async/await
- Keep logic focused on request/response
- Handle errors gracefully

For `src/server.ts`:

- only add the games route wiring
- do not change unrelated server setup

---

## Scripts

Use the following scripts:

- `npm run setup` — Install project dependencies
- `npm run setup:clean` — Reinstall dependencies from scratch

- `npm run build` — Compile TypeScript
- `npm run lint` — Check for lint errors
- `npm run format:check` — Verify formatting
- `npm run format` — Auto-format code

- `npm run db:recreate` — Reset database
- `npm run db:clear:check` — Verify DB is clean

### Script Guidelines

You may create temporary helper scripts in your local branch if needed to support development or testing.

- You may add new scripts inside the `"scripts"` section of `package.json` for your own workflow
- Do NOT modify or remove existing shared scripts without team agreement
- Do NOT rename existing scripts
- These scripts are optional and for local use only
- Do NOT rely on custom scripts for required validation

👉 Required validation must still be done using the standard scripts listed above.

### What to Run During Development

Start the server (Terminal 1):

```bash
npm run dev
```

Keep this running while you work.

#### When making API changes

After updating routes or DB logic:

```bash
npm run build
```

If needed, restart the server.

#### When database changes are made

After creating or modifying migrations:

```bash
npm run migrate:up
```

If your database gets into a bad state:

```bash
npm run db:recreate
npm run migrate:up
```

To verify database is clean:

```bash
npm run db:clear:check
```

#### When fixing errors

Check for issues:

```bash
npm run lint
npm run format:check
```

Fix formatting automatically:

```bash
npm run format
```

#### General workflow

Typical development loop:

```text
1. npm run dev
2. make changes
3. test in browser / terminal
4. fix issues
5. repeat
```

---

## Local Testing Checklist

Before moving forward, verify the API manually.

### 1. Start the server (Terminal 1)

Open a terminal and run:

```bash
npm run dev
```

Keep this terminal running.

Verify:

- server starts without errors
- terminal shows server running on localhost

### 2. Create or log in as a user (Browser)

Open your browser:

```text
http://localhost:3000/auth/login
```

If needed, register a user first:

```text
http://localhost:3000/auth/register
```

Verify:

- you can log in successfully
- you are redirected to `/lobby`
- navbar shows logged-in state

### 3. Test GET /api/games in browser

Open:

```text
http://localhost:3000/api/games
```

Verify:

- response is valid JSON
- response contains a `games` key
- no server errors occur

### 4. Test GET /api/games in terminal (Terminal 2)

Open a **new terminal window** and run:

```bash
curl http://localhost:3000/api/games
```

Verify:

- response is valid JSON
- structure matches expected format

### 5. Test POST /api/games (authenticated)

Because the frontend is not implemented yet:

- use your logged-in browser session OR
- use an API tool (Postman / browser dev tools)

Verify:

- request succeeds while authenticated
- response returns created game data
- no server errors occur

### 6. Verify database updates (Terminal 2)

In the same second terminal, run:

```bash
npx dotenv -e .env -- psql "$DATABASE_URL"
```

Then run:

```sql
SELECT
  *
FROM
  games;
```

Verify:

- a new game row exists

Then run:

```sql
SELECT
  *
FROM
  game_users;
```

Verify:

- a row exists linking the user to the game

### 7. Verify multiple game creation

Send another authenticated POST request.

Verify:

- multiple games exist in the database
- GET /api/games returns all games
- newest games appear first

### 8. Test unauthenticated behavior

Log out in the browser or use a new session.

Then test:

```text
http://localhost:3000/api/games
```

and attempt a POST request.

Verify:

- POST fails or redirects appropriately
- behavior matches expected auth rules

### 9. Check server logs (Terminal 1)

While testing:

- confirm no runtime errors in Terminal 1
- confirm no unhandled exceptions

### 10. Exit psql (Terminal 2)

```sql
\q
```

### 11. Final validation (Terminal 2)

Run:

```bash
npm run check:base:pr
```

Verify:

- build passes
- lint passes
- format check passes
- no runtime errors

---

## PR Target

```text
m8-api → m8
```

**👉 Follow the full PR process here:**  
**[Pull Request Guide](../../guides/pull-request-guide.md)**

---

## Monday 04/06

Pull latest from `main`:

```bash
git checkout main
git pull origin main
```

Test demo locally:

```bash
npm run setup
npm run db:recreate
npm run migrate:up
npm run dev
```

Then:

- Verify the demo works using `main`
- Present the project and follow slide presenter notes
- Run demo using `main`

---

## Definition of Done

You are done when:

- routes are implemented
- routes return correct JSON
- routes connect to DB layer correctly
- routes are mounted in server.ts
- no runtime errors
- npm run check:base:pr passes
- demo plan is completed
- presentation is completed
- only assigned files were modified
