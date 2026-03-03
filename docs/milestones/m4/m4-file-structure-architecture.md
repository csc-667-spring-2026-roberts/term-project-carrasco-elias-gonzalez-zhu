# M4 (File Structure & Architecture)

**CSC 667 Term Project**\
**Milestone: M4 (Express Setup)**

This document explains the current project structure and highlights
newly added files for M4.

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

Purpose: - Demonstrates Express static file serving - Provides visual
confirmation server is running

------------------------------------------------------------------------

## Documentation

    docs/
      milestones/
        m4/
          m4-local-setup.md       # Setup & verification instructions
          slides-link.md       # Link to presentation slides
          file-structure-architecture.md  # This document

------------------------------------------------------------------------

## Summary

M4 introduces:

-   Express server setup
-   Static file serving
-   Development workflow standardization
-   Node version enforcement
-   Deterministic dependency installation