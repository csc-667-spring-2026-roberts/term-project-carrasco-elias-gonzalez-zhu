# M8 (Work Split — Breanna)

**CSC 667 Term Project**  
**Milestone: M8 (Frontend Tooling + Games API + Lobby)**

Work is divided by layer ownership to enable parallel development.  
Each person owns a set of files and must implement within those boundaries.

👉 **Before proceeding**, ensure you have completed all steps in  
**[M6/M7 Local Setup Guide](../m6-m7/m6-m7-local-setup.md)**

This guide only covers **new work required for M8**.

---

## 📅 Due Dates (Breanna)

### Sunday 04/05 (End of Day)

- Pull latest from `m8`
- Complete frontend implementation
- Open PR → `m8`

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
git checkout -b m8-client
git push origin m8-client
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

## Frontend (`m8-client`)

### Assigned Files

```text
src/client/lobby.ts
views/lobby.ejs
public/css/main.css
views/partials/*.ejs
views/auth/*.ejs
```

👉 You are responsible for implementing frontend logic in `src/client/lobby.ts`.  
👉 You may update styling in the EJS and CSS files listed above.  
👉 Do NOT modify files outside of your assigned ownership.  
👉 Do NOT modify shared contracts without team agreement.

### Required Files

```text
src/client/lobby.ts
views/lobby.ejs
```

👉 These files are required to complete M8 functionality.

### Optional Files (Styling Only)

```text
public/css/main.css
views/partials/*.ejs
views/auth/*.ejs
```

👉 You may update styling (layout, classes, UI improvements) in these files.

### Main Goal

Your job is to complete the **frontend lobby behavior**.

This includes:

- implementing frontend logic in `src/client/lobby.ts`
- preserving the DOM contract in `views/lobby.ejs`
- optionally improving styling in `public/css/main.css`, `views/partials/*.ejs`, and `views/auth/*.ejs`

### Shared Contracts (Do Not Modify)

The following files are shared across layers and must remain stable:

- src/routes/games.ts
- src/db/games.ts
- src/types/types.ts

The following contract inside `views/lobby.ejs` must remain stable:

```text
#games-list
#create-game
<script src="/js/lobby.js" defer>
```

👉 Do NOT modify these files or contracts without team agreement.

### Frontend Requirements (`src/client/lobby.ts`)

You must implement logic in:

```text
src/client/lobby.ts
```

Responsibilities:

- fetch data from `/api/games`
- render games into `#games-list`
- handle click event on `#create-game`
- reload the game list after creation

### DOM Contract (`views/lobby.ejs`)

The following elements in `views/lobby.ejs` must remain unchanged:

```text
#games-list
#create-game
<script src="/js/lobby.js" defer>
```

### Styling Scope

You may update styling in the following files:

```text
views/lobby.ejs
public/css/main.css
views/partials/*.ejs
views/auth/*.ejs
```

Constraints:

- Do NOT remove or rename required DOM IDs in `views/lobby.ejs`
- Do NOT remove script reference in `views/lobby.ejs`
- Do NOT change backend contracts or routes
- Do NOT move frontend logic out of `src/client/lobby.ts`

### Implementation Notes

For `src/client/lobby.ts`:

- Use `fetch` for API calls
- Use DOM methods to update the UI
- Keep all frontend behavior inside `src/client/lobby.ts`

For styling files:

- You may improve layout, spacing, classes, and presentation
- Styling changes are optional and should not break required functionality

---

## Scripts

Use the following scripts:

- `npm run setup` — Install project dependencies
- `npm run setup:clean` — Reinstall dependencies from scratch

- `npm run dev` — Run server and client together
- `npm run build` — Compile TypeScript
- `npm run build:client` — Build frontend JS bundle

- `npm run lint` — Check for lint errors
- `npm run format:check` — Verify formatting
- `npm run format` — Auto-format code

### Script Guidelines

You may create temporary helper scripts in your local branch if needed.

- You may add new scripts to `package.json`
- Do NOT modify or remove existing scripts
- Do NOT rely on custom scripts for required validation

👉 Required validation must use the standard scripts

### What to Run During Development

Start the server (Terminal 1):

```bash
npm run dev
```

Keep this running while you work.

#### When making frontend changes

Save changes to:

```text
src/client/lobby.ts
```

ESBuild will automatically rebuild:

```text
public/js/lobby.js
```

#### When fixing errors

Check:

```bash
npm run lint
npm run format:check
```

Fix:

```bash
npm run format
```

#### General workflow

```text
1. npm run dev
2. update frontend code
3. test in browser
4. fix issues
5. repeat
```

---

## Local Testing Checklist

Before moving forward, verify the frontend manually.

### 1. Start the app (Terminal 1)

Open a terminal and run:

```bash
npm run dev
```

Keep this terminal running during testing.

Verify in Terminal 1:

- the server starts without errors
- the client build starts without errors
- changes to `src/client/lobby.ts` trigger a rebuild

### 2. Open the app in Google Chrome

Open **Google Chrome** and navigate to:

```text
http://localhost:3000/auth/login
```

If you do not already have a user, open:

```text
http://localhost:3000/auth/register
```

Create a user and log in.

Verify:

- you can log in successfully
- you are redirected to `/lobby`
- the lobby page loads without errors

### 3. Open Chrome DevTools

In Google Chrome:

- right click the page
- click **Inspect**
- open the **Console** tab
- open the **Network** tab

Keep both tabs open while testing.

### 4. Verify the client script is running

Refresh the `/lobby` page.

In the **Console tab**, verify:

- `"Lobby client loaded"` appears
- there are no JavaScript errors
- there are no failed script loads

In the **Network tab**, verify:

- `/js/lobby.js` loads successfully
- status code is successful

### 5. Verify initial game loading

Refresh the page.

In the **Network tab**, verify:

- a request is sent to:

```text
/api/games
```

- the request succeeds
- the response contains JSON data

On the page, verify:

- content appears inside `#games-list`
- the loading message is replaced
- the page is not stuck on "Loading games..."

### 6. Verify the Create Game button

On the lobby page, locate:

```text
Create Game
```

Verify:

- the button is visible
- the button is clickable
- it corresponds to `#create-game`

### 7. Test create game flow

Click the **Create Game** button.

In the **Network tab**, verify:

- a `POST` request is sent to:

```text
/api/games
```

- the request succeeds
- the response returns game data

On the page, verify:

- the game list updates
- a new game appears

In Terminal 1, verify:

- no runtime errors appear

### 8. Test multiple game creation

Click the button again.

Verify:

- another POST request is sent
- multiple games appear
- UI updates correctly
- no duplicate rendering issues occur

### 9. Verify game list reload

Refresh the page.

Verify:

- a new GET request is sent to `/api/games`
- all games re-render correctly

### 10. Verify DOM elements exist

In Chrome Console, run:

```javascript
document.querySelector("#games-list");
document.querySelector("#create-game");
```

Verify:

- neither returns `null`

### 11. Check server logs (Terminal 1)

Verify:

- no errors appear in Terminal 1
- API requests succeed

### 12. Run final validation (Terminal 2)

Open a new terminal window and run:

```bash
npm run check:base:pr
```

Verify:

- build passes
- lint passes
- format check passes

### 13. Final confirmation

Verify:

- `/lobby` loads correctly in Chrome
- `/js/lobby.js` loads correctly
- console shows `"Lobby client loaded"`
- GET `/api/games` works
- POST `/api/games` works
- UI updates dynamically
- no errors in Chrome DevTools
- no errors in Terminal 1

---

## PR Target

```text
m8-client → m8
```

**👉 Follow the full PR process here:**  
**[Pull Request Guide](../../guides/pull-request-guide.md)**

---

## Definition of Done

You are done when:

- frontend logic is implemented
- games render correctly in the UI
- create game button works
- UI updates dynamically
- no runtime errors
- npm run check:base:pr passes
- only assigned files were modified
