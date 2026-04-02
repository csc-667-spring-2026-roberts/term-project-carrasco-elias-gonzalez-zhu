# M4 (Local Setup & Verification Guide)

**CSC 667 Term Project**\
**Milestone: M4 (Express Setup)**

> ⚠️ **Status:** This document is part of the M4 implementation.  
> It is retained here for reference and documentation purposes.

This guide ensures every team member can clone the main branch and verify it runs locally.

---

## Quick Setup

### 1) Clone, switch to the main branch, pull

Clone **once** on your machine:

```bash
git clone https://github.com/csc-667-spring-2026-roberts/term-project-carrasco-elias-gonzalez-zhu.git
```

Change directory, swtich to main branch, and pull latest changes:

```bash
cd term-project-carrasco-elias-gonzalez-zhu
git checkout main
git pull
```

### 2) Use Node 20 (Required)

Check your current Node version:

```bash
node -v
```

If using nvm:

- If the version does **not** start with `v20`, do the following:
  - Install Node 20 **(run only once on your machine):**

    ```bash
    nvm install 20
    ```

- Activate Node 20 **(run this every time you open a new terminal for this project):**

  ```bash
  nvm use
  ```

Verify:

```bash
node -v   # should be v20.x.x
npm -v
```

### 3) Configure Git line endings (important)

Run **once** on your machine:

**macOS / Linux:**

```bash
git config --global core.autocrlf input
```

**Windows:**

```bash
git config --global core.autocrlf true
```

This ensures line endings are consistent and prevents large, noisy diffs.

### 4) Install dependencies (repeatable)

Run this once **OR** after a dependency changes:

```bash
npm ci
```

This project uses `npm ci` **exclusively**.
**Do NOT use `npm install`.**

- `npm ci` ensures everyone installs the exact dependency tree from `package-lock.json`.

If you **accidentally** run `npm install`, **reset with**:

```bash
rm -rf node_modules
npm ci
```

### 5) Copy environment file

Run this once **OR** after new environment variables are introduced:

```bash
cp .env.example .env
```

### 6) Start the development server

Run to test server:

```bash
npm run dev
```

Open on browser: **http://localhost:3000**

After testing, use a **keyboard shortcut** to **stop the server**:

```code
Ctrl + C
```

### 7) Build check

Run build check.

```bash
npm run build
```

This confirms TypeScript compiles successfully and ensures the project builds cleanly.

### 8) Lint & Format Check (Recommended)

Verify code quality tools are working:

```bash
npm run lint
npm run format
```

---

## Sanity Checklist (Must Pass)

- Node version is `20.x`
- `npm ci` completes successfully
- `npm run dev` starts the server
- The app loads in the browser
- `npm run build` completes without errors
