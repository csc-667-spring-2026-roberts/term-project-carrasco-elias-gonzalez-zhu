import "dotenv/config";
import { Client } from "pg";

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  return databaseUrl;
}

function getTargetDatabaseName(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.replace(/^\//, "");

  if (!databaseName) {
    throw new Error("Could not determine database name from DATABASE_URL.");
  }

  return databaseName;
}

function getMaintenanceDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);

  // Connect to a different database so we can drop/recreate the target one.
  url.pathname = "/postgres";

  return url.toString();
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function main(): Promise<void> {
  const databaseUrl = getDatabaseUrl();
  const targetDatabase = getTargetDatabaseName(databaseUrl);
  const maintenanceDatabaseUrl = getMaintenanceDatabaseUrl(databaseUrl);

  if (targetDatabase === "postgres") {
    throw new Error(
      'Refusing to recreate the "postgres" maintenance database. Check DATABASE_URL.',
    );
  }

  console.log(`Recreating database: ${targetDatabase}`);

  const client = new Client({
    connectionString: maintenanceDatabaseUrl,
  });

  await client.connect();

  try {
    await client.query(
      `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1
          AND pid <> pg_backend_pid();
      `,
      [targetDatabase],
    );

    const quotedDatabaseName = quoteIdentifier(targetDatabase);

    await client.query(`DROP DATABASE IF EXISTS ${quotedDatabaseName};`);
    await client.query(`CREATE DATABASE ${quotedDatabaseName};`);

    console.log(`Database recreated successfully: ${targetDatabase}`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`recreate-database.ts: FAIL - ${message}`);
  process.exit(1);
});
