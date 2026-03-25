# M5 PostgreSQL Installation Guide (Mac + Windows)

**CSC 667 Term Project**\  
**Milestone: M5 (Database Integration)**

> ⚠️ **Status:** This guide has been updated to reflect the finalized M5 setup.

This guide walks you through installing PostgreSQL and verifying that it works for M5.

By the end, you should be able to:
- Install PostgreSQL
- Start the database server
- Connect using `psql`
- Create the required database (`term_project_dev`)
- Configure `DATABASE_URL`
- Verify your setup works with the project

**Note:** Unless otherwise stated, all instructions and commands apply to both Mac and Windows.

---

## 🧪 First-Time Setup

Follow this section if you are installing PostgreSQL for the first time.

### Step 1: Install PostgreSQL

**Recommended:** Install PostgreSQL version 14 or newer. **Versions 15 or 16 are preferred**.

#### Option A (Mac - Homebrew)

``` bash
brew install postgresql@16
```

``` bash
brew services start postgresql@16
```

#### Option B (Mac or Windows Installer)

Download from:  
https://www.postgresql.org/download/

Run the installer and follow setup.

⚠️ Important:
- Remember the password for the `postgres` user
- Keep default port: `5432`

### Step 2: Verify Installation

``` bash
psql --version
```

Expected:
- Version prints
- No errors

### Step 3: Ensure Server is Running

**Mac:**
``` bash
brew services list | grep postgresql
```

**Windows:**
- Open Services or pgAdmin
- Confirm PostgreSQL service is running

### Step 4: Connect to PostgreSQL

``` bash
psql -U postgres -h localhost
```

Expected:
- You enter `psql`
- Prompt looks like: `postgres=#` (or similar)

**💡 Note:**
- Commands like `\dt` and SQL queries must be run **inside the `psql` shell** (after connecting to a database)
- You should see `postgres=#` (or similar) before running them

### Step 5: Create the Project Database

**Mac:**
``` bash
createdb term_project_dev
```

**Windows:**
``` bash
psql -U postgres -h localhost -c "CREATE DATABASE term_project_dev;"
```

Verify:

``` bash
psql -U postgres -h localhost -l
```

Expected:
- `term_project_dev` exists

### Step 6: Configure DATABASE_URL

Create a `.env` file in your project root if it does not exist:

[insert here]

Use `.env.example` as a reference.
- Make sure `.env` is saved in the project root directory.
- No further changes needed for **Mac**.

#### 🚨 Windows DATABASE_URL Setup
**⚠️ Do NOT edit `.env.example`.**
**❗️ Only manually update the `.env` file:**

- Find the current `DATABASE_URL` line in **`.env`**
  ```env
  DATABASE_URL=postgres://localhost:5432/term_project_dev
  ```
- Find the **Windows `DATABASE_URL`** line in `.env.example` (currently commented out)
  ```env
  DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/term_project_dev
  ```
- In **`.env`**, replace current `DATABASE_URL` with the **Windows `DATABASE_URL`**
- Replace `YOUR_PASSWORD` with your **actual PostgreSQL password**

**After editing `.env`:**
```env
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSOWRD@localhost:5432/term_project_dev
SESSION_SECRET=change-me
```

### Step 7: Run Smoke Test

``` bash
npm run db:smoke
```

Expected:
- No errors
- Tables are created

---

## 🔍 If You Already Set Up PostgreSQL (Troubleshooting)

If your setup was completed earlier but something is not working, use the fixes below.

### ❌ PostgreSQL not installed or wrong version

Check version:

``` bash
psql --version
```

Expected:
- **Version 14 or newer**

Fix:

- **Mac:**
  ``` bash
  brew uninstall postgresql@15
  brew uninstall postgresql@14
  brew uninstall postgresql
  brew install postgresql@16
  brew services start postgresql@16
  ```

- **Windows:**
  - Uninstall PostgreSQL (if needed)
  - Reinstall from official site
  - Set password for `postgres`

---

### ❌ PostgreSQL server not running

**Mac:**
``` bash
brew services restart postgresql@16
```

- If still not running:
  ``` bash
  brew services stop postgresql@16
  brew services start postgresql@16
  ```

**Windows:**
- Open Services
- Start PostgreSQL service
- Or start via pgAdmin

---

### ❌ Cannot connect to PostgreSQL

Try:

``` bash
psql -U postgres -h localhost
```

Fix:
- Ensure server is running
- Verify username (`postgres`)
- Verify password

---

### ❌ Database does not exist

Check:

``` bash
psql -U postgres -h localhost -l
```

Fix:

- **Mac:**
  ``` bash
  createdb term_project_dev
  ```

- **Windows:**
  ``` bash
  psql -U postgres -h localhost -c "CREATE DATABASE term_project_dev;"
  ```

---

### ❌ DATABASE_URL is incorrect

Check `.env`:
- File exists in project root
- Contains `DATABASE_URL`

Fix:

- Mac:
  ``` bash
  DATABASE_URL=postgres://localhost:5432/term_project_dev
  ```

- Windows:
  ``` bash
  DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/term_project_dev
  ```
  - ⚠️ Replace `YOUR_PASSWORD` with your **actual PostgreSQL password**
---

### ❌ DATABASE_URL is not being used

Symptoms:
- wrong username appears (e.g., Windows username)
- password prompt appears unexpectedly

Fix:

- **Mac:**
  ``` bash
  export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/term_project_dev"
  ```

- **Windows:**
  ``` bash
  $env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/term_project_dev"
  ```

Also:
- restart terminal
- verify `.env` is loaded

---

### ❌ Smoke test fails

Run:

``` bash
npm run db:smoke
```

Check:
- server running
- database exists
- `DATABASE_URL` is correct

---

### 🧹 Clean Reset (if stuck)

If multiple issues persist, reset your database:

1. Delete database:

   - **Mac:**
   ``` bash
   dropdb term_project_dev
   ```

   - **Windows:**
   ``` bash
   psql -U postgres -h localhost -c "DROP DATABASE term_project_dev;"
   ```

2. Recreate database:
   - **Mac:**  
   ``` bash
   createdb term_project_dev
   ```

   - **Windows:**
   ``` bash
   psql -U postgres -h localhost -c "CREATE DATABASE term_project_dev;"
   ```

3. Run smoke test:  
   ``` bash
   npm run db:smoke
   ```

---

### ❌ Tables are missing

Check tables:

``` bash
psql -U postgres -h localhost -d term_project_dev
```

**💡 Note:**
- `\dt` must be run inside `psql` (after connecting to a database)

Fix:

``` bash
npm run db:smoke
```

---

### ❌ Cannot see data in tables

Run:

``` bash
SELECT * FROM games;
```

**💡 Note:**
- SQL queries must be run inside `psql` (after connecting to a database)

Fix:
- rerun smoke test
- confirm correct database is used

---

## 🔍 Verification (For Everyone)

Use this section to confirm your setup is correct.

---

### 1. PostgreSQL is installed

``` bash
psql --version
```

---

### 2. Server is running

**Mac:**
``` bash
brew services list | grep postgresql
```

Windows:
- Check Services / pgAdmin

---

### 3. Database exists

``` bash
psql -U postgres -h localhost -l
```

---

### 4. DATABASE_URL is correct

Check `.env`:

- Mac → default  
- Windows → manually change in .env

---

### 5. Smoke test works

``` bash
npm run db:smoke
```

---

### 6. Database contains tables

Connect to your project database:
``` bash
psql -U postgres -h localhost -d term_project_dev
```

List tables:
``` bash
\dt
```

**💡 Note:**
- `\dt` and SQL queries must be run inside `psql` (after connecting to a database)

You should see a prompt like `term_project_dev=#`

Optional:
``` bash
SELECT * FROM games;
```

---

## 🚀 Summary

Mac setup is usually straightforward.

Windows setup may require:
- manually setting environment variables
- ensuring database exists
- verifying username/password

---

## ✅ Final Checklist

- PostgreSQL installed (14+)
- Server running
- Can connect with `psql`
- `term_project_dev` exists
- `.env` is correct
- `db:smoke` runs successfully
- Tables exist in database