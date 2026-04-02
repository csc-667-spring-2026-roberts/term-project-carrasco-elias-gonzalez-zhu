// TODO Jonathan:
// Create the "game_users" table with:
// - game_id (foreign key → games.id)
// - user_id (foreign key → users.id)
// - joined_at (timestamp, default now, not null)
//
// Requirements:
// - composite primary key on (game_id, user_id)
// - cascade delete when game is deleted

import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // TODO Jonathan:
  // Implement pgm.createTable("game_users", {...})
  // Add composite primary key
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // TODO Jonathan:
  // Drop "game_users" table
}
