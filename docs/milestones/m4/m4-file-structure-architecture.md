# M4 (File Structure & Architecture)

**CSC 667 Term Project**\
**Milestone: M4 (Express Setup)**

This document explains the current project structure and highlights
newly added files for M4.

------------------------------------------------------------------------

## Project Structure

term-project/

term-project/
├── src/
│   └── index.ts                                    # Express app entry point (NEW)
│
├── public/
│   ├── index.html                                  # Static homepage (NEW)
│   └── styles.css                                  # Basic styling (NEW)
│
├── docs/
│   └── milestones/
│       └── m4/
│           ├── m4-local-setup.md                   # Local setup instructions (NEW)
│           ├── m4-slides-link.md                   # Presentation link (NEW)
│           └── m4-file-structure-architecture.md   # Architecture documentation (NEW)
│
├── database/
├── views/
│
├── .husky/
│
├── .editorconfig                                   # Formatting rules (NEW)
├── .gitattributes                                  # Line ending normalization (NEW)
├── .gitignore
├── .nvmrc                                          # Node version lock (NEW)
├── .env.example
├── .prettierrc
│
├── package.json
├── package-lock.json
├── tsconfig.json
├── eslint.config.js
└── README.md

------------------------------------------------------------------------

## Project Root

    term-project-carrasco-elias-gonzalez-zhu/

------------------------------------------------------------------------

## Configuration Files

    .editorconfig              # (NEW) Enforces consistent formatting across editors
    .gitattributes             # (NEW) Enforces LF line endings
    .nvmrc                     # (NEW) Enforces Node 20 usage
    .gitignore                 # Ignores build artifacts and environment files
    package.json               # Project dependencies and scripts
    package-lock.json          # Locked dependency tree (used by npm ci)
    tsconfig.json              # TypeScript configuration
    eslint.config.js           # ESLint configuration
    .prettierrc                # Prettier configuration

------------------------------------------------------------------------

## Husky

    .husky/                    # Git hooks configuration
      pre-commit               # Runs lint-staged before commits
      _/                       # Husky internal hook helpers

Purpose: - Enforces linting and formatting before commits. - Maintains
code consistency across team.

------------------------------------------------------------------------

## Source Code (Backend)

    src/
      index.ts                 # (NEW) Express application entry point

### index.ts Responsibilities

-   Initializes Express
-   Configures middleware
-   Serves static files from /public
-   Defines `GET /` route
-   Defines `GET /health` route
-   Starts server on PORT

------------------------------------------------------------------------

## Public (Frontend)

    public/
      index.html               # (NEW) Main static page
      styles.css               # (NEW) Basic styling

Purpose: 
- Demonstrates Express static file serving 
- Provides visual confirmation server is running

------------------------------------------------------------------------

## Documentation

    docs/
      milestones/
        m4/
          m4-local-setup.md               # (NEW) Setup & verification instructions
          slides-link.md                  # (NEW) Link to presentation slides
          file-structure-architecture.md  # (NEW) This document

------------------------------------------------------------------------

## Summary

M4 introduces:

-   Express server setup
-   Static file serving
-   Development workflow standardization
-   Node version enforcement
-   Deterministic dependency installation