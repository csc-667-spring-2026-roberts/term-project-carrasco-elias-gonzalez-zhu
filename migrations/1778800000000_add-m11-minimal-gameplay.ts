import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

const suits = ["clubs", "diamonds", "hearts", "spades"];
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

function cardRows(): string {
  const rows: string[] = [];
  let id = 1;

  suits.forEach((suit, suitIndex) => {
    ranks.forEach((rank, rankIndex) => {
      rows.push(
        `(${String(id)}, '${suit}', '${rank}', '${rank} ${suit}', ${String(
          suitIndex * ranks.length + rankIndex + 1,
        )})`,
      );
      id += 1;
    });
  });

  return rows.join(",\n");
}

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("games", {
    max_players: {
      type: "integer",
      notNull: true,
      default: 4,
    },
    started_at: {
      type: "timestamp",
    },
    current_turn_seat: {
      type: "integer",
    },
  });

  pgm.addColumns("game_users", {
    seat: {
      type: "integer",
    },
  });

  pgm.addConstraint("games", "games_max_players_check", {
    check: "max_players BETWEEN 2 AND 4",
  });

  pgm.addConstraint("games", "games_current_turn_seat_check", {
    check: "current_turn_seat IS NULL OR current_turn_seat BETWEEN 1 AND 4",
  });

  pgm.addConstraint("game_users", "game_users_seat_check", {
    check: "seat IS NULL OR seat BETWEEN 1 AND 4",
  });

  pgm.sql(`
    UPDATE game_users gu
    SET seat = ranked.seat
    FROM (
      SELECT
        game_id,
        user_id,
        ROW_NUMBER() OVER (
          PARTITION BY game_id
          ORDER BY joined_at ASC
        )::int AS seat
      FROM game_users
    ) ranked
    WHERE gu.game_id = ranked.game_id
      AND gu.user_id = ranked.user_id
      AND ranked.seat <= 4;
  `);

  pgm.sql(`
    CREATE UNIQUE INDEX game_users_game_id_seat_unique
    ON game_users (game_id, seat)
    WHERE seat IS NOT NULL;
  `);

  pgm.createTable("cards", {
    id: {
      type: "integer",
      primaryKey: true,
    },
    suit: {
      type: "varchar(10)",
      notNull: true,
    },
    rank: {
      type: "varchar(2)",
      notNull: true,
    },
    label: {
      type: "varchar(20)",
      notNull: true,
    },
    sort_order: {
      type: "integer",
      notNull: true,
    },
  });

  pgm.addConstraint("cards", "cards_suit_check", {
    check: "suit IN ('clubs', 'diamonds', 'hearts', 'spades')",
  });

  pgm.createTable("game_cards", {
    id: "id",
    game_id: {
      type: "integer",
      notNull: true,
      references: "games",
      onDelete: "CASCADE",
    },
    card_id: {
      type: "integer",
      notNull: true,
      references: "cards",
      onDelete: "RESTRICT",
    },
    user_id: {
      type: "integer",
      references: "users",
      onDelete: "SET NULL",
    },
    location: {
      type: "varchar(20)",
      notNull: true,
      default: "deck",
    },
    played_order: {
      type: "integer",
    },
    played_at: {
      type: "timestamp",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.addConstraint("game_cards", "game_cards_location_check", {
    check: "location IN ('deck', 'hand', 'played')",
  });

  pgm.addConstraint("game_cards", "game_cards_game_card_unique", {
    unique: ["game_id", "card_id"],
  });

  pgm.createIndex("game_cards", ["game_id", "user_id", "location"], {
    name: "idx_game_cards_game_user_location",
  });

  pgm.createIndex("game_cards", ["game_id", "location", "played_order"], {
    name: "idx_game_cards_game_location_played_order",
  });

  pgm.sql(`
    INSERT INTO cards (id, suit, rank, label, sort_order)
    VALUES
    ${cardRows()};
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("game_cards");
  pgm.dropTable("cards");

  pgm.sql("DROP INDEX IF EXISTS game_users_game_id_seat_unique;");

  pgm.dropConstraint("game_users", "game_users_seat_check");
  pgm.dropConstraint("games", "games_current_turn_seat_check");
  pgm.dropConstraint("games", "games_max_players_check");

  pgm.dropColumns("game_users", ["seat"]);
  pgm.dropColumns("games", ["max_players", "started_at", "current_turn_seat"]);
}
