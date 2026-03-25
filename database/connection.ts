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
import { env } from "../src/config/env.js";

const pgp: IMain = pgPromise();

// Reusable database instance; pg-promise manages connection pooling internally.
export const db: IDatabase<unknown> = pgp(env.databaseUrl);