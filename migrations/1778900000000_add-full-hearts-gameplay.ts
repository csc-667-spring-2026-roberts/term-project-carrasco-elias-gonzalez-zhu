import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("games", {
    phase: {
      type: "varchar(20)",
      notNull: true,
      default: "waiting",
    },
    current_hand_no: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    current_trick_no: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    lead_seat: {
      type: "integer",
    },
    hearts_broken: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    pass_direction: {
      type: "varchar(10)",
      notNull: true,
      default: "left",
    },
    finished_at: {
      type: "timestamp",
    },
    last_event: {
      type: "varchar(255)",
    },
    target_score: {
      type: "integer",
      notNull: true,
      default: 100,
    },
  });

  pgm.addColumns("game_users", {
    total_score: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    hand_score: {
      type: "integer",
      notNull: true,
      default: 0,
    },
  });

  pgm.addColumns("game_cards", {
    owner_seat: {
      type: "integer",
    },
    trick_no: {
      type: "integer",
    },
    trick_order: {
      type: "integer",
    },
    taken_by_seat: {
      type: "integer",
    },
    pass_from_seat: {
      type: "integer",
    },
    pass_to_seat: {
      type: "integer",
    },
    passed_at: {
      type: "timestamp",
    },
  });

  pgm.sql(`
    UPDATE games
    SET phase = CASE
      WHEN status = 'finished' THEN 'finished'
      WHEN status = 'in_progress' THEN 'playing'
      ELSE 'waiting'
    END;
  `);

  pgm.sql(`
    UPDATE game_cards gc
    SET owner_seat = gu.seat
    FROM game_users gu
    WHERE gc.game_id = gu.game_id
      AND gc.user_id = gu.user_id
      AND gc.location = 'hand';
  `);

  pgm.sql(`
    UPDATE game_cards
    SET location = 'taken'
    WHERE location = 'played';
  `);

  pgm.dropConstraint("game_cards", "game_cards_location_check");

  pgm.addConstraint("games", "games_phase_check", {
    check: "phase IN ('waiting', 'passing', 'playing', 'finished')",
  });

  pgm.addConstraint("games", "games_pass_direction_check", {
    check: "pass_direction IN ('left', 'right', 'across', 'hold')",
  });

  pgm.addConstraint("games", "games_lead_seat_check", {
    check: "lead_seat IS NULL OR lead_seat BETWEEN 1 AND 4",
  });

  pgm.addConstraint("games", "games_current_hand_no_check", {
    check: "current_hand_no >= 0",
  });

  pgm.addConstraint("games", "games_current_trick_no_check", {
    check: "current_trick_no BETWEEN 0 AND 13",
  });

  pgm.addConstraint("games", "games_target_score_check", {
    check: "target_score > 0",
  });

  pgm.addConstraint("game_users", "game_users_score_check", {
    check: "total_score >= 0 AND hand_score >= 0",
  });

  pgm.addConstraint("game_cards", "game_cards_location_check", {
    check: "location IN ('deck', 'hand', 'passing', 'trick', 'taken')",
  });

  pgm.addConstraint("game_cards", "game_cards_owner_seat_check", {
    check: "owner_seat IS NULL OR owner_seat BETWEEN 1 AND 4",
  });

  pgm.addConstraint("game_cards", "game_cards_taken_by_seat_check", {
    check: "taken_by_seat IS NULL OR taken_by_seat BETWEEN 1 AND 4",
  });

  pgm.addConstraint("game_cards", "game_cards_pass_from_seat_check", {
    check: "pass_from_seat IS NULL OR pass_from_seat BETWEEN 1 AND 4",
  });

  pgm.addConstraint("game_cards", "game_cards_pass_to_seat_check", {
    check: "pass_to_seat IS NULL OR pass_to_seat BETWEEN 1 AND 4",
  });

  pgm.addConstraint("game_cards", "game_cards_trick_order_check", {
    check: "trick_order IS NULL OR trick_order BETWEEN 1 AND 4",
  });

  pgm.addConstraint("game_cards", "game_cards_trick_no_check", {
    check: "trick_no IS NULL OR trick_no BETWEEN 1 AND 13",
  });

  pgm.createIndex("game_cards", ["game_id", "owner_seat", "location"], {
    name: "idx_game_cards_game_owner_location",
  });

  pgm.createIndex("game_cards", ["game_id", "trick_no", "trick_order"], {
    name: "idx_game_cards_game_trick_order",
  });

  pgm.createIndex("game_cards", ["game_id", "taken_by_seat"], {
    name: "idx_game_cards_game_taken_by",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("game_cards", ["game_id", "taken_by_seat"], {
    name: "idx_game_cards_game_taken_by",
  });
  pgm.dropIndex("game_cards", ["game_id", "trick_no", "trick_order"], {
    name: "idx_game_cards_game_trick_order",
  });
  pgm.dropIndex("game_cards", ["game_id", "owner_seat", "location"], {
    name: "idx_game_cards_game_owner_location",
  });

  pgm.dropConstraint("game_cards", "game_cards_trick_no_check");
  pgm.dropConstraint("game_cards", "game_cards_trick_order_check");
  pgm.dropConstraint("game_cards", "game_cards_pass_to_seat_check");
  pgm.dropConstraint("game_cards", "game_cards_pass_from_seat_check");
  pgm.dropConstraint("game_cards", "game_cards_taken_by_seat_check");
  pgm.dropConstraint("game_cards", "game_cards_owner_seat_check");
  pgm.dropConstraint("game_cards", "game_cards_location_check");
  pgm.dropConstraint("game_users", "game_users_score_check");
  pgm.dropConstraint("games", "games_target_score_check");
  pgm.dropConstraint("games", "games_current_trick_no_check");
  pgm.dropConstraint("games", "games_current_hand_no_check");
  pgm.dropConstraint("games", "games_lead_seat_check");
  pgm.dropConstraint("games", "games_pass_direction_check");
  pgm.dropConstraint("games", "games_phase_check");

  pgm.sql(`
    UPDATE game_cards
    SET location = CASE
      WHEN location IN ('trick', 'taken') THEN 'played'
      WHEN location = 'passing' THEN 'hand'
      ELSE location
    END;
  `);

  pgm.addConstraint("game_cards", "game_cards_location_check", {
    check: "location IN ('deck', 'hand', 'played')",
  });

  pgm.dropColumns("game_cards", [
    "owner_seat",
    "trick_no",
    "trick_order",
    "taken_by_seat",
    "pass_from_seat",
    "pass_to_seat",
    "passed_at",
  ]);

  pgm.dropColumns("game_users", ["total_score", "hand_score"]);

  pgm.dropColumns("games", [
    "phase",
    "current_hand_no",
    "current_trick_no",
    "lead_seat",
    "hearts_broken",
    "pass_direction",
    "finished_at",
    "last_event",
    "target_score",
  ]);
}
