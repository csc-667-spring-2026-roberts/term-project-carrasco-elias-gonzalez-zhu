# M6/M7 (Local Setup Guide)

**CSC 667 Term Project**  
**Milestone: M6/M7 (Authentication/Templating)**

👉 **Before proceeding**, ensure you have completed all steps in  
**[M5 Local Setup Guide](../m5/local-setup.md)**

This guide only covers **new setup required for M6/M7**.

---

## 🧠 Branch Setup

- Base branch: `m6-m7`
- Your branch:
  - Person 1 → `m6-m7-data` (Database)
  - Person 2 → `m6-m7-auth` (Auth Backend)
  - Person 3 → `m6-m7-ui` (Views / UI)
  - Person 4 → `m6-m7-core` (Scaffolding / Integration)

---

## ✅ Steps

### 1. Pull Latest Code

Before starting work:

```bash
git checkout m6-m7
git pull origin m6-m7
```

### 2. Switch to Your Branch

Use your assigned branch:

```bash
git checkout m6-m7-[your-role]
git pull origin m6-m7-[your-role]
```

### 3. Install Node Dependencies

Install all required dependencies:

```bash
npm ci
```

### 4. Configure Session Secret

Open `.env` and update:

```env
SESSION_SECRET=change-me
```

Update `SESSION_SECRET`:

- For local development (quick start):
  - use `dev-secret`

- For a stronger secret:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### 5. Recreate Your Local Database

Reset your local database to a clean state:

```bash
npm run db:recreate
```

---

## 🔧 Helpful Commands

- `npm ci` — Install dependencies (run once at the beginning of M6/M7)
- `npm run db:recreate` — Reset your local database to a clean state

---

## 🚀 Next Steps

Once setup is complete, continue with:

👉 **[M6/M7 Work Split](work-split.md)**

This document outlines:

- what each person is responsible for
- how to implement each part
- how to validate your work
