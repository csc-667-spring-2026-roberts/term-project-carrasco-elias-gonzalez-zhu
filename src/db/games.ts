/**
 * DB Layer: Games
 *
 * This file is responsible for all database operations related to games.
 */

import db from "./connection.js";
import type { Game, GameCard, GameListItem, GamePlayer, GameState } from "../types/types.js";

const MIN_PLAYERS_TO_START = 2;
const CARDS_PER_PLAYER = 5;

type Queryable = Pick<typeof db, "manyOrNone" | "none" | "one" | "oneOrNone">;

interface CountRow {
  count: number;
}

interface IdRow {
  id: number;
}

interface NextOrderRow {
  next_order: number;
}

interface SeatRow {
  seat: number;
}

export class GameActionError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "GameActionError";
    this.statusCode = statusCode;
  }
}

/**
 * Creates a new game and inserts the creator into game_users.
 *
 * Creator/host is not stored explicitly; it is derived from the earliest joined_at.
 */
export async function createGame(userId: number): Promise<Game> {
  return db.tx(async (t) => {
    const game = await insertGame(t);
    const seat = await nextAvailableSeat(t, game.id, game.max_players);

    if (seat === null) {
      throw new GameActionError(409, "Game is full.");
    }

    await addUserToGame(t, game.id, userId, seat);

    return findGameById(t, game.id);
  });
}

/**
 * Finds an existing waiting game or creates one, then joins the current user.
 */
export async function joinOrCreateGame(userId: number): Promise<Game> {
  return db.tx(async (t) => {
    const existingGame = await findExistingActiveGame(t, userId);

    if (existingGame) {
      await maybeStartGame(t, existingGame.id);
      return findGameById(t, existingGame.id);
    }

    const joinableGame = await findJoinableGame(t);
    const game = joinableGame ?? (await insertGame(t));
    const seat = await nextAvailableSeat(t, game.id, game.max_players);

    if (seat === null) {
      throw new GameActionError(409, "Game is full.");
    }

    await addUserToGame(t, game.id, userId, seat);
    await maybeStartGame(t, game.id);

    return findGameById(t, game.id);
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
        g.max_players,
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
      GROUP BY g.id, g.status, g.created_at, g.max_players, u.email
      ORDER BY g.created_at DESC
    `,
  );
}

export async function getGameState(gameId: number, userId: number): Promise<GameState> {
  const game = await findGameByIdOrNull(db, gameId);

  if (!game) {
    throw new GameActionError(404, "Game not found.");
  }

  const membership = await findUserSeat(db, gameId, userId);

  if (!membership) {
    throw new GameActionError(403, "You are not in this game.");
  }

  const players = await listPlayers(db, gameId);
  const hand = await listHand(db, gameId, userId);
  const playedCards = await listPlayedCards(db, gameId);

  return {
    game: {
      id: game.id,
      status: game.status,
      started_at: game.started_at,
      current_turn_seat: game.current_turn_seat,
    },
    players,
    hand,
    playedCards,
    currentUserId: userId,
    canPlay: game.status === "in_progress" && game.current_turn_seat === membership.seat,
    statusText: buildStatusText(game, players, membership.seat),
  };
}

export async function playCard(gameId: number, userId: number, gameCardId: number): Promise<void> {
  await db.tx(async (t) => {
    const game = await findGameForUpdate(t, gameId);
    const membership = await findUserSeat(t, gameId, userId);

    if (!membership) {
      throw new GameActionError(403, "You are not in this game.");
    }

    if (game.status !== "in_progress") {
      throw new GameActionError(409, "Game has not started yet.");
    }

    if (game.current_turn_seat !== membership.seat) {
      throw new GameActionError(409, "It is not your turn.");
    }

    const card = await t.oneOrNone<IdRow>(
      `
        SELECT id
        FROM game_cards
        WHERE id = $1
          AND game_id = $2
          AND user_id = $3
          AND location = 'hand'
        FOR UPDATE
      `,
      [gameCardId, gameId, userId],
    );

    if (!card) {
      throw new GameActionError(400, "That card is not in your hand.");
    }

    const playedOrder = await nextPlayedOrder(t, gameId);

    await t.none(
      `
        UPDATE game_cards
        SET location = 'played',
            played_order = $2,
            played_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [gameCardId, playedOrder],
    );

    const nextSeat = await nextOccupiedSeat(t, gameId, membership.seat);

    await t.none(
      `
        UPDATE games
        SET current_turn_seat = $2
        WHERE id = $1
      `,
      [gameId, nextSeat],
    );
  });
}

async function addUserToGame(
  database: Queryable,
  gameId: number,
  userId: number,
  seat: number,
): Promise<void> {
  await database.none(
    `
      INSERT INTO game_users (game_id, user_id, seat)
      VALUES ($1, $2, $3)
      ON CONFLICT (game_id, user_id)
      DO UPDATE SET seat = COALESCE(game_users.seat, EXCLUDED.seat)
    `,
    [gameId, userId, seat],
  );
}

function buildStatusText(game: Game, players: GamePlayer[], currentUserSeat: number): string {
  if (game.status === "waiting") {
    return (
      "Waiting for another player (" +
      String(players.length) +
      "/" +
      String(MIN_PLAYERS_TO_START) +
      ")."
    );
  }

  if (game.status === "in_progress" && game.current_turn_seat === currentUserSeat) {
    return "Your turn. Play one card.";
  }

  if (game.status === "in_progress") {
    const currentPlayer = players.find((player) => player.seat === game.current_turn_seat);

    return `${currentPlayer?.display_name ?? "Another player"}'s turn.`;
  }

  return "Game finished.";
}

async function countGameUsers(database: Queryable, gameId: number): Promise<number> {
  const row = await database.one<CountRow>(
    `
      SELECT COUNT(*)::int AS count
      FROM game_users
      WHERE game_id = $1
    `,
    [gameId],
  );

  return row.count;
}

async function dealCards(
  database: Queryable,
  gameId: number,
  players: GamePlayer[],
): Promise<void> {
  for (const player of players) {
    const cards = await database.manyOrNone<IdRow>(
      `
        SELECT gc.id
        FROM game_cards gc
        INNER JOIN cards c ON c.id = gc.card_id
        WHERE gc.game_id = $1
          AND gc.location = 'deck'
        ORDER BY c.sort_order ASC
        LIMIT $2
      `,
      [gameId, CARDS_PER_PLAYER],
    );
    const cardIds = cards.map((card) => card.id);

    if (cardIds.length === 0) {
      return;
    }

    await database.none(
      `
        UPDATE game_cards
        SET location = 'hand',
            user_id = $<userId>
        WHERE id IN ($<cardIds:csv>)
      `,
      {
        userId: player.user_id,
        cardIds,
      },
    );
  }
}

async function ensureDeckRows(database: Queryable, gameId: number): Promise<void> {
  await database.none(
    `
      INSERT INTO game_cards (game_id, card_id, location)
      SELECT $1, id, 'deck'
      FROM cards
      ON CONFLICT (game_id, card_id) DO NOTHING
    `,
    [gameId],
  );
}

async function findExistingActiveGame(database: Queryable, userId: number): Promise<Game | null> {
  return database.oneOrNone<Game>(
    `
      SELECT
        g.id,
        g.status,
        g.created_at,
        g.max_players,
        g.started_at,
        g.current_turn_seat
      FROM games g
      INNER JOIN game_users gu ON gu.game_id = g.id
      WHERE gu.user_id = $1
        AND g.status IN ('waiting', 'in_progress')
      ORDER BY g.created_at DESC
      LIMIT 1
    `,
    [userId],
  );
}

async function findGameById(database: Queryable, gameId: number): Promise<Game> {
  const game = await findGameByIdOrNull(database, gameId);

  if (!game) {
    throw new GameActionError(404, "Game not found.");
  }

  return game;
}

async function findGameByIdOrNull(database: Queryable, gameId: number): Promise<Game | null> {
  return database.oneOrNone<Game>(
    `
      SELECT
        id,
        status,
        created_at,
        max_players,
        started_at,
        current_turn_seat
      FROM games
      WHERE id = $1
    `,
    [gameId],
  );
}

async function findGameForUpdate(database: Queryable, gameId: number): Promise<Game> {
  const game = await database.oneOrNone<Game>(
    `
      SELECT
        id,
        status,
        created_at,
        max_players,
        started_at,
        current_turn_seat
      FROM games
      WHERE id = $1
      FOR UPDATE
    `,
    [gameId],
  );

  if (!game) {
    throw new GameActionError(404, "Game not found.");
  }

  return game;
}

async function findJoinableGame(database: Queryable): Promise<Game | null> {
  const game = await database.oneOrNone<Game>(
    `
      SELECT
        g.id,
        g.status,
        g.created_at,
        g.max_players,
        g.started_at,
        g.current_turn_seat
      FROM games g
      LEFT JOIN game_users gu ON gu.game_id = g.id
      WHERE g.status = 'waiting'
      GROUP BY g.id
      HAVING COUNT(gu.user_id) < g.max_players
      ORDER BY g.created_at ASC
      LIMIT 1
    `,
  );

  if (!game) {
    return null;
  }

  const lockedGame = await findGameForUpdate(database, game.id);

  if (lockedGame.status !== "waiting") {
    return null;
  }

  const playerCount = await countGameUsers(database, lockedGame.id);

  if (playerCount >= lockedGame.max_players) {
    return null;
  }

  return lockedGame;
}

async function findUserSeat(
  database: Queryable,
  gameId: number,
  userId: number,
): Promise<SeatRow | null> {
  return database.oneOrNone<SeatRow>(
    `
      SELECT seat
      FROM game_users
      WHERE game_id = $1
        AND user_id = $2
        AND seat IS NOT NULL
    `,
    [gameId, userId],
  );
}

async function insertGame(database: Queryable): Promise<Game> {
  return database.one<Game>(
    `
      INSERT INTO games DEFAULT VALUES
      RETURNING id, status, created_at, max_players, started_at, current_turn_seat
    `,
  );
}

async function listHand(database: Queryable, gameId: number, userId: number): Promise<GameCard[]> {
  return database.manyOrNone<GameCard>(
    `
      SELECT
        gc.id AS game_card_id,
        c.id AS card_id,
        c.suit,
        c.rank,
        c.label,
        gc.location,
        gc.user_id,
        gc.played_order,
        gc.played_at
      FROM game_cards gc
      INNER JOIN cards c ON c.id = gc.card_id
      WHERE gc.game_id = $1
        AND gc.user_id = $2
        AND gc.location = 'hand'
      ORDER BY c.sort_order ASC
    `,
    [gameId, userId],
  );
}

async function listPlayedCards(database: Queryable, gameId: number): Promise<GameCard[]> {
  return database.manyOrNone<GameCard>(
    `
      SELECT
        gc.id AS game_card_id,
        c.id AS card_id,
        c.suit,
        c.rank,
        c.label,
        gc.location,
        gc.user_id,
        gc.played_order,
        gc.played_at
      FROM game_cards gc
      INNER JOIN cards c ON c.id = gc.card_id
      WHERE gc.game_id = $1
        AND gc.location = 'played'
      ORDER BY gc.played_order ASC
    `,
    [gameId],
  );
}

async function listPlayers(database: Queryable, gameId: number): Promise<GamePlayer[]> {
  return database.manyOrNone<GamePlayer>(
    `
      SELECT
        gu.user_id,
        u.display_name,
        gu.seat
      FROM game_users gu
      INNER JOIN users u ON u.id = gu.user_id
      WHERE gu.game_id = $1
        AND gu.seat IS NOT NULL
      ORDER BY gu.seat ASC
    `,
    [gameId],
  );
}

async function maybeStartGame(database: Queryable, gameId: number): Promise<void> {
  const game = await findGameForUpdate(database, gameId);

  if (game.status !== "waiting") {
    return;
  }

  const players = await listPlayers(database, gameId);

  if (players.length < MIN_PLAYERS_TO_START) {
    return;
  }

  await ensureDeckRows(database, gameId);

  const assignedCards = await database.one<CountRow>(
    `
      SELECT COUNT(*)::int AS count
      FROM game_cards
      WHERE game_id = $1
        AND location IN ('hand', 'played')
    `,
    [gameId],
  );

  if (assignedCards.count === 0) {
    await dealCards(database, gameId, players);
  }

  const firstPlayer = players.at(0);

  if (!firstPlayer) {
    return;
  }

  await database.none(
    `
      UPDATE games
      SET status = 'in_progress',
          started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
          current_turn_seat = COALESCE(current_turn_seat, $2)
      WHERE id = $1
    `,
    [gameId, firstPlayer.seat],
  );
}

async function nextAvailableSeat(
  database: Queryable,
  gameId: number,
  maxPlayers: number,
): Promise<number | null> {
  const seat = await database.oneOrNone<SeatRow>(
    `
      SELECT candidate.seat
      FROM generate_series(1, $2) AS candidate(seat)
      WHERE NOT EXISTS (
        SELECT 1
        FROM game_users gu
        WHERE gu.game_id = $1
          AND gu.seat = candidate.seat
      )
      ORDER BY candidate.seat ASC
      LIMIT 1
    `,
    [gameId, maxPlayers],
  );

  return seat?.seat ?? null;
}

async function nextOccupiedSeat(
  database: Queryable,
  gameId: number,
  currentSeat: number,
): Promise<number> {
  const seats = await database.manyOrNone<SeatRow>(
    `
      SELECT seat
      FROM game_users
      WHERE game_id = $1
        AND seat IS NOT NULL
      ORDER BY seat ASC
    `,
    [gameId],
  );
  const seatNumbers = seats.map((seat) => seat.seat);
  const laterSeat = seatNumbers.find((seat) => seat > currentSeat);
  const nextSeat = laterSeat ?? seatNumbers.at(0);

  if (nextSeat === undefined) {
    throw new GameActionError(409, "No occupied seats are available.");
  }

  return nextSeat;
}

async function nextPlayedOrder(database: Queryable, gameId: number): Promise<number> {
  const order = await database.one<NextOrderRow>(
    `
      SELECT COALESCE(MAX(played_order), 0)::int + 1 AS next_order
      FROM game_cards
      WHERE game_id = $1
    `,
    [gameId],
  );

  return order.next_order;
}
