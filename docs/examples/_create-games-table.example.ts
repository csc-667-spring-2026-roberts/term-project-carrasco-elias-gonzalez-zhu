// TODO Jonathan:
// Create the "games" table with:
// - id (primary key)
// - status (string or enum, not null)
// - created_at (timestamp, default now, not null)

import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // TODO Jonathan:
  // Implement pgm.createTable("games", {...})
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // TODO Jonathan:
  // Drop "games" table
}
