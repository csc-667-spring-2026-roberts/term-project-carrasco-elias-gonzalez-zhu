// TODO Jonathan:
// Create the "games" table for M8 with only the fields needed now:
// - id (primary key)
// - status (VARCHAR(20), not null, default "waiting")
// - created_at (timestamp, default now, not null)
//
// Requirements:
// - status must be limited to the following values:
//   - waiting
//   - in_progress
//   - finished
// - implement this using a CHECK constraint
//
// Notes:
// - Keep this migration minimal for M8.
// - Do NOT add future gameplay fields yet.

import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // TODO Jonathan:
  // Implement pgm.createTable("games", {...})
  //
  // Include only:
  // - id
  // - status
  // - created_at
  //
  // Constraints:
  // - status is VARCHAR(20), NOT NULL, default "waiting"
  // - add a CHECK constraint so status is limited to:
  //   - waiting
  //   - in_progress
  //   - finished
  //
  // created_at:
  // - should default to CURRENT_TIMESTAMP
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // TODO Jonathan:
  // Drop "games" table
}
