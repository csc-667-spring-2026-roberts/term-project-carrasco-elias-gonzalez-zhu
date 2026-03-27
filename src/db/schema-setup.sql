-- M6/M7 Auth Schema (Local Setup)
-- This file is used by the `db:schema` (setup-schema.ts) script
-- to create the users and session tables for local development.
-- Intended for Person 2 (Auth Backend) to quickly prepare a local database.
-- Person 1 (Database) must use migrations as the source of truth.
-- Migrations remain the canonical schema definition for this project.

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);

COMMIT;