/**
 * M5 Database Connection
 *
 * Contract:
 * - Initialize pg-promise once using DATABASE_URL
 * - Export a reusable `db` instance
 * - Do NOT create a new connection per request
 * - Keep implementation simple (no extra abstraction for M5)
 *
 * This module is the single integration point between Express routes and PostgreSQL.
 */

import pgPromise, { type IDatabase, type IMain } from "pg-promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  // Fail fast in dev/demo if env is misconfigured.
  // This is preferable to confusing runtime errors later.
  // eslint-disable-next-line no-console
  console.error("DATABASE_URL is not set. Please configure it in your .env file.");
  throw new Error("DATABASE_URL is required but was not provided.");
}

const pgp: IMain = pgPromise();

// Reusable database instance; pg-promise manages connection pooling internally.
export const db: IDatabase<unknown> = pgp(DATABASE_URL);
