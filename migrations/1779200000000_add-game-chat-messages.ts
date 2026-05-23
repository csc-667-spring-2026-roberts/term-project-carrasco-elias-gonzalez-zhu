import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("game_chat_messages", {
    id: "id",
    game_id: {
      type: "integer",
      notNull: true,
      references: "games",
      onDelete: "CASCADE",
    },
    user_id: {
      type: "integer",
      references: "users",
      onDelete: "SET NULL",
    },
    message: {
      type: "text",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("game_chat_messages", ["game_id", "created_at", "id"], {
    name: "idx_game_chat_messages_game_id_created_at_id",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("game_chat_messages");
}
