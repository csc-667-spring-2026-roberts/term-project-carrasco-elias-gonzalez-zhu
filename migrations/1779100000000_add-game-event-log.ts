import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("game_events", {
    id: "id",
    game_id: {
      type: "integer",
      notNull: true,
      references: "games",
      onDelete: "CASCADE",
    },
    hand_no: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    trick_no: {
      type: "integer",
    },
    actor_seat: {
      type: "integer",
    },
    actor_user_id: {
      type: "integer",
      references: "users",
      onDelete: "SET NULL",
    },
    event_type: {
      type: "varchar(20)",
      notNull: true,
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

  pgm.addConstraint("game_events", "game_events_event_type_check", {
    check: "event_type IN ('system', 'pass', 'play', 'trick', 'score', 'leave')",
  });

  pgm.addConstraint("game_events", "game_events_hand_no_check", {
    check: "hand_no >= 0",
  });

  pgm.addConstraint("game_events", "game_events_trick_no_check", {
    check: "trick_no IS NULL OR trick_no BETWEEN 0 AND 13",
  });

  pgm.addConstraint("game_events", "game_events_actor_seat_check", {
    check: "actor_seat IS NULL OR actor_seat BETWEEN 1 AND 4",
  });

  pgm.createIndex("game_events", ["game_id", "id"], {
    name: "idx_game_events_game_id_id",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("game_events");
}
