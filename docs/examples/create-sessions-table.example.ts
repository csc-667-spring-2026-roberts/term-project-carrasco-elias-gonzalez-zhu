// TODO [Person 1]:
// Create the "session" table with:
// - sid (primary key)
// - sess (json, not null)
// - expire (timestamp, not null)
// Also create an index on "expire"

import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // TODO [Person 1]:
  // Implement pgm.createTable("session", {...})
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // TODO [Person 1]:
  // Drop index and table
}