// TODO Jonathan:
// Create the "game_users" table for M8 with only the fields needed now:
// - game_id (foreign key -> games.id)
// - user_id (foreign key -> users.id)
// - joined_at (timestamp, default now, not null)
//
// Requirements:
// - composite primary key on (game_id, user_id)
// - cascade delete when game is deleted
//
// Notes:
// - Keep this migration minimal for M8.
// - Do NOT add future gameplay fields yet.
// - This table represents the relationship between games and users.
// - Each row = one user in one game.
// - joined_at acts as the row creation timestamp for this table.
// - Creator/host is derived later from the earliest joined_at for a game.

import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // TODO Jonathan:
  // Implement pgm.createTable("game_users", {...})
  //
  // Include only:
  // - game_id
  // - user_id
  // - joined_at
  //
  // Constraints:
  // - game_id references games.id (ON DELETE CASCADE)
  // - user_id references users.id (ON DELETE CASCADE)
  // - joined_at defaults to CURRENT_TIMESTAMP
  //
  // Add a composite primary key on:
  // - game_id
  // - user_id
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // TODO Jonathan:
  // Drop "game_users" table
}
