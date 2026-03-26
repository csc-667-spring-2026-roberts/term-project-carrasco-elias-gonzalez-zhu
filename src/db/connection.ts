import pgPromise from "pg-promise";
import "dotenv/config";

const pgp = pgPromise();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const db = pgp(databaseUrl);

export default db;