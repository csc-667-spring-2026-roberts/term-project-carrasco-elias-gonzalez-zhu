// TODO [Person 1]:
// Create the "users" table with the following columns:
// - id (primary key, auto-increment)
// - email (varchar, unique, not null)
// - password_hash (varchar, not null)
// - display_name (varchar, not null)
// - created_at (timestamp, default CURRENT_TIMESTAMP)

import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // TODO [Person 1]:
  // Implement pgm.createTable("users", {...})
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // TODO [Person 1]:
  // Drop the "users" table
}