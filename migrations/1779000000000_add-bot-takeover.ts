import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("game_users", {
    is_bot: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    disconnected_at: {
      type: "timestamp",
    },
    left_at: {
      type: "timestamp",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("game_users", ["is_bot", "disconnected_at", "left_at"]);
}
