/**
 * DB Layer: Games
 *
 * This file is responsible for all database operations related to games.
 */

import db from "./connection.js";
import type { Game, GameListItem } from "../types/types.js";

/**
 * Creates a new game and inserts the creator into game_users.
 *
 * Creator/host is not stored explicitly; it is derived from the earliest joined_at.
 */
export async function createGame(userId: number): Promise<Game> {
  return db.tx(async (t) => {
    const game = await t.one<Game>(
      `
        INSERT INTO games DEFAULT VALUES
        RETURNING id, status, created_at
      `,
    );

    await t.none(
      `
        INSERT INTO game_users (game_id, user_id,seat)
        VALUES ($1, $2, $3)
      `,
      [game.id, userId, 1],
    );

    return game;
  });
}

/**
 * Returns all games for the lobby view, newest first.
 */
export async function listGames(): Promise<GameListItem[]> {
  return db.manyOrNone<GameListItem>(
    `
      SELECT
        g.id,
        g.status,
        g.created_at,
        u.email AS creator_email,
        COUNT(gu_all.user_id)::int AS player_count
      FROM games g
      INNER JOIN (
        SELECT DISTINCT ON (game_id) game_id, user_id
        FROM game_users
        ORDER BY game_id, joined_at ASC
      ) gu_first ON gu_first.game_id = g.id
      INNER JOIN users u ON u.id = gu_first.user_id
      INNER JOIN game_users gu_all ON gu_all.game_id = g.id
      GROUP BY g.id, g.status, g.created_at, u.email
      ORDER BY g.created_at DESC
    `,
  );
}
