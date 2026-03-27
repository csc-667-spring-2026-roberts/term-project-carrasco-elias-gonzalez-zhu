import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import db from "../../db/connection.js";
import { create, existing, findByEmail } from "../../db/users.js";
import type { DbUser, User } from "../../types/types.js";

interface TableExistsRow {
  exists: boolean;
}

interface ColumnRow {
  column_name: string;
}

interface ConstraintRow {
  constraint_name: string;
  constraint_type: string;
}

interface IndexRow {
  indexname: string;
}

interface MigrationRow {
  name: string;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function projectPath(...segments: string[]): string {
  return path.resolve(process.cwd(), ...segments);
}

function checkRequiredFiles(): void {
  const requiredFiles = ["src/db/users.ts", "src/types/types.ts"];

  for (const file of requiredFiles) {
    const fullPath = projectPath(file);
    assert(fs.existsSync(fullPath), `Missing required file: ${file}`);
  }

  const migrationsDir = projectPath("migrations");
  assert(fs.existsSync(migrationsDir), "Missing required directory: migrations");

  const migrationFiles = fs.readdirSync(migrationsDir);

  const hasUsersMigration = migrationFiles.some((file) => file.includes("create-users-table"));
  const hasSessionsMigration = migrationFiles.some((file) =>
    file.includes("create-sessions-table"),
  );

  assert(hasUsersMigration, 'Missing migration file containing "create-users-table"');
  assert(hasSessionsMigration, 'Missing migration file containing "create-sessions-table"');
}

async function tableExists(tableName: string): Promise<boolean> {
  const row = await db.one<TableExistsRow>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [tableName],
  );

  return row.exists;
}

async function getColumns(tableName: string): Promise<string[]> {
  const rows = await db.manyOrNone<ColumnRow>(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    [tableName],
  );

  return rows.map((row) => row.column_name);
}

async function getConstraints(tableName: string): Promise<ConstraintRow[]> {
  return db.manyOrNone<ConstraintRow>(
    `
      SELECT tc.constraint_name, tc.constraint_type
      FROM information_schema.table_constraints AS tc
      WHERE tc.table_schema = 'public'
        AND tc.table_name = $1
    `,
    [tableName],
  );
}

async function getIndexes(tableName: string): Promise<string[]> {
  const rows = await db.manyOrNone<IndexRow>(
    `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = $1
    `,
    [tableName],
  );

  return rows.map((row) => row.indexname);
}

async function checkTablesExist(): Promise<void> {
  const requiredTables = ["users", "session", "pgmigrations"];

  for (const table of requiredTables) {
    const exists = await tableExists(table);
    assert(exists, `Missing required table: ${table}`);
  }
}

async function checkUsersSchema(): Promise<void> {
  const columns = await getColumns("users");
  const requiredColumns = ["id", "email", "password_hash", "display_name", "created_at"];

  for (const column of requiredColumns) {
    assert(columns.includes(column), `Missing users.${column} column`);
  }

  const constraints = await getConstraints("users");
  const hasPrimaryKey = constraints.some(
    (constraint) => constraint.constraint_type === "PRIMARY KEY",
  );
  const hasUniqueEmail = constraints.some(
    (constraint) =>
      constraint.constraint_type === "UNIQUE" && constraint.constraint_name.includes("email"),
  );

  assert(hasPrimaryKey, "users table is missing a primary key");
  assert(hasUniqueEmail, "users.email is missing a unique constraint");
}

async function checkSessionSchema(): Promise<void> {
  const columns = await getColumns("session");
  const requiredColumns = ["sid", "sess", "expire"];

  for (const column of requiredColumns) {
    assert(columns.includes(column), `Missing session.${column} column`);
  }

  const constraints = await getConstraints("session");
  const hasPrimaryKey = constraints.some(
    (constraint) => constraint.constraint_type === "PRIMARY KEY",
  );

  assert(hasPrimaryKey, "session table is missing a primary key");

  const indexes = await getIndexes("session");
  assert(
    indexes.includes("idx_session_expire"),
    "Missing required index: idx_session_expire on session(expire)",
  );
}

async function checkMigrationsApplied(): Promise<void> {
  const rows = await db.manyOrNone<MigrationRow>(
    `
      SELECT name
      FROM pgmigrations
      ORDER BY id
    `,
  );

  const migrationNames = rows.map((row) => row.name);

  const hasUsersMigration = migrationNames.some((name) => name.includes("create-users-table"));
  const hasSessionsMigration = migrationNames.some((name) =>
    name.includes("create-sessions-table"),
  );

  assert(hasUsersMigration, 'pgmigrations is missing an entry containing "create-users-table"');
  assert(
    hasSessionsMigration,
    'pgmigrations is missing an entry containing "create-sessions-table"',
  );
}

async function cleanupTestUser(email: string): Promise<void> {
  await db.none("DELETE FROM users WHERE email = $1", [email]);
}

async function checkUserHelpers(): Promise<void> {
  const timestamp = Date.now();
  const testEmail = `check-db-${String(timestamp)}@example.com`;
  const testPasswordHash = "test-password-hash";
  const testDisplayName = "Check Database User";
  const missingEmail = `missing-${String(timestamp)}@example.com`;

  await cleanupTestUser(testEmail);

  const existsBefore = await existing(testEmail);
  assert(!existsBefore, "existing(email) returned true before insert");

  const createdUser: User = await create(testEmail, testPasswordHash, testDisplayName);

  assert(typeof createdUser.id === "number", "create() did not return a numeric id");
  assert(createdUser.email === testEmail, "create() returned incorrect email");
  assert(createdUser.display_name === testDisplayName, "create() returned incorrect display_name");
  assert(createdUser.created_at instanceof Date, "create() did not return created_at as a Date");

  const createdUserAsRecord = createdUser as unknown as Record<string, unknown>;
  assert(
    !("password_hash" in createdUserAsRecord),
    "create() returned password_hash, which is not allowed",
  );

  const existsAfter = await existing(testEmail);
  assert(existsAfter, "existing(email) returned false after insert");

  const dbUser: DbUser | null = await findByEmail(testEmail);
  assert(dbUser !== null, "findByEmail(email) returned null for inserted user");
  assert(dbUser.id === createdUser.id, "findByEmail() returned incorrect id");
  assert(dbUser.email === testEmail, "findByEmail() returned incorrect email");
  assert(
    dbUser.password_hash === testPasswordHash,
    "findByEmail() did not return the correct password_hash",
  );
  assert(dbUser.display_name === testDisplayName, "findByEmail() returned incorrect display_name");
  assert(dbUser.created_at instanceof Date, "findByEmail() did not return created_at as a Date");

  const missingUser = await findByEmail(missingEmail);
  assert(missingUser === null, "findByEmail(nonexistent) did not return null");

  let duplicateFailed = false;
  try {
    await create(testEmail, "another-hash", "Duplicate User");
  } catch {
    duplicateFailed = true;
  }

  assert(duplicateFailed, "Expected duplicate email insert to fail");

  await cleanupTestUser(testEmail);
}

async function main(): Promise<void> {
  console.log("Checking required files...");
  checkRequiredFiles();

  console.log("Checking database tables...");
  await checkTablesExist();

  console.log("Checking users schema...");
  await checkUsersSchema();

  console.log("Checking session schema...");
  await checkSessionSchema();

  console.log("Checking applied migrations...");
  await checkMigrationsApplied();

  console.log("Checking user helper functions...");
  await checkUserHelpers();

  console.log("check-database.ts: PASS");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`check-database.ts: FAIL - ${message}`);
  process.exit(1);
});
