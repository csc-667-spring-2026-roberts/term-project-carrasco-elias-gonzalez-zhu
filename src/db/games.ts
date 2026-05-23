/**
 * DB Layer: Games
 *
 * This file owns the server-authoritative Hearts rules and game state.
 */

import { randomInt } from "node:crypto";

import db from "./connection.js";
import type {
  CardSuit,
  Game,
  GameCard,
  GameChatMessage,
  GameEvent,
  GameEventType,
  GameListItem,
  GamePlayer,
  GameState,
  PassDirection,
} from "../types/types.js";

const REQUIRED_PLAYERS = 4;
const CARDS_PER_PLAYER = 13;
const PASS_CARD_COUNT = 3;
const BOT_ACTION_LIMIT = 600;
const BOT_ACTION_DELAY_MS = envNumber("BOT_ACTION_DELAY_MS", 1500);
const MOVE_LOG_LIMIT = 20;
const CHAT_MESSAGE_LIMIT = 50;
const CHAT_MESSAGE_MAX_LENGTH = 300;

type Queryable = Pick<typeof db, "manyOrNone" | "none" | "one" | "oneOrNone">;
type GameCardRow = Omit<GameCard, "is_playable">;
export type BotActionCallback = (gameId: number) => Promise<void> | void;

const runningBotGames = new Set<number>();

interface CountRow {
  count: number;
}

interface IdRow {
  id: number;
}

interface NextOrderRow {
  next_order: number;
}

interface ScoreRow {
  seat: number;
  hand_score: number;
  total_score: number;
}

interface SeatRow {
  seat: number;
}

interface MembershipRow extends SeatRow {
  is_bot: boolean;
  disconnected_at: Date | null;
}

interface UserIdRow {
  user_id: number;
}

export class GameActionError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "GameActionError";
    this.statusCode = statusCode;
  }
}

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

export async function joinOrCreateGame(userId: number): Promise<Game> {
  return db.tx(async (t) => {
    const reclaimedGame = await reclaimBotSeat(t, userId);

    if (reclaimedGame) {
      return reclaimedGame;
    }

    const existingGame = await findExistingActiveGame(t, userId);

    if (existingGame) {
      await maybeStartGame(t, existingGame.id);
      return findGameById(t, existingGame.id);
    }

    const joinableGame = await findJoinableGame(t, userId);
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

export async function listGames(): Promise<GameListItem[]> {
  return db.manyOrNone<GameListItem>(
    `
      SELECT
        g.id,
        g.status,
        g.phase,
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
      GROUP BY g.id, g.status, g.phase, g.created_at, g.max_players, u.email
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
  const handRows = await listHandRows(db, gameId, membership.seat);
  const currentTrickRows = await listCurrentTrickRows(db, game);
  const moveLog = await listRecentGameEvents(db, gameId);
  const hasPassed = await hasSeatPassed(db, gameId, membership.seat);
  const canControlSeat = !membership.is_bot;
  const hand = markPlayableCards(game, handRows, currentTrickRows, membership.seat, canControlSeat);
  const playedCards = currentTrickRows.map((card) => ({ ...card, is_playable: false }));

  return {
    game: {
      id: game.id,
      status: game.status,
      phase: game.phase,
      started_at: game.started_at,
      current_turn_seat: game.current_turn_seat,
      current_hand_no: game.current_hand_no,
      current_trick_no: game.current_trick_no,
      lead_seat: game.lead_seat,
      hearts_broken: game.hearts_broken,
      pass_direction: game.pass_direction,
      target_score: game.target_score,
      last_event: game.last_event,
    },
    players,
    hand,
    playedCards,
    moveLog,
    currentUserId: userId,
    currentUserSeat: membership.seat,
    canPlay:
      canControlSeat && game.phase === "playing" && game.current_turn_seat === membership.seat,
    canPass: canControlSeat && canSeatPass(game, hasPassed, handRows.length),
    hasPassed,
    requiredPassCount: PASS_CARD_COUNT,
    statusText: buildStatusText(game, players, membership.seat, hasPassed),
  };
}

export async function passCards(
  gameId: number,
  userId: number,
  gameCardIds: number[],
): Promise<void> {
  await db.tx(async (t) => {
    const game = await findGameForUpdate(t, gameId);
    const membership = await findUserSeat(t, gameId, userId);

    if (!membership) {
      throw new GameActionError(403, "You are not in this game.");
    }

    if (membership.is_bot) {
      throw new GameActionError(409, "A bot has already taken over this seat.");
    }

    validatePassRequest(game, gameCardIds);

    if (await hasSeatPassed(t, gameId, membership.seat)) {
      throw new GameActionError(409, "You have already passed cards for this hand.");
    }

    const cards = await findHandRowsByIdsForUpdate(t, gameId, membership.seat, gameCardIds);

    if (cards.length !== gameCardIds.length) {
      throw new GameActionError(400, "Choose three cards from your hand.");
    }

    await markCardsForPassing(t, game, membership.seat, gameCardIds);
    const players = await listPlayers(t, gameId);
    await logGameEvent(
      t,
      game,
      "pass",
      `${playerLogNameBySeat(players, membership.seat)} passed ${String(PASS_CARD_COUNT)} cards ${passDirectionLabel(
        game.pass_direction,
      )}.`,
      membership.seat,
      userId,
    );

    if (await allPlayersPassed(t, game.id)) {
      await applyPassedCards(t, game.id);
      await beginPlayPhase(t, game, "All players passed. The two of clubs leads.");
    }
  });
}

export async function playCard(gameId: number, userId: number, gameCardId: number): Promise<void> {
  await db.tx(async (t) => {
    const game = await findGameForUpdate(t, gameId);
    const membership = await findUserSeat(t, gameId, userId);

    if (!membership) {
      throw new GameActionError(403, "You are not in this game.");
    }

    if (membership.is_bot) {
      throw new GameActionError(409, "A bot has already taken over this seat.");
    }

    validatePlayTurn(game, membership.seat);

    const hand = await listHandRowsForUpdate(t, gameId, membership.seat);
    const card = hand.find((candidate) => candidate.game_card_id === gameCardId);

    if (!card) {
      throw new GameActionError(400, "That card is not in your hand.");
    }

    const currentTrick = await listCurrentTrickRows(t, game);
    const playError = findPlayViolation(game, hand, currentTrick, card);

    if (playError) {
      throw new GameActionError(400, playError);
    }

    const trickOrder = currentTrick.length + 1;
    const playedOrder = await nextPlayedOrder(t, gameId);

    await moveCardToTrick(t, game, card, trickOrder, playedOrder);
    await logCardPlayed(t, game, membership.seat, userId, card);
    await advanceAfterPlay(t, game, currentTrick, card, membership.seat, trickOrder);
  });
}

export async function listGameChatMessages(
  gameId: number,
  userId: number,
): Promise<GameChatMessage[]> {
  await ensureGameMember(db, gameId, userId);

  return listRecentChatMessages(db, gameId);
}

export async function sendGameChatMessage(
  gameId: number,
  userId: number,
  rawMessage: string,
): Promise<GameChatMessage> {
  const message = validateChatMessage(rawMessage);

  return db.tx(async (t) => {
    await ensureGameMember(t, gameId, userId);

    return t.one<GameChatMessage>(
      `
        INSERT INTO game_chat_messages (game_id, user_id, message)
        VALUES ($1, $2, $3)
        RETURNING
          id,
          game_id,
          user_id,
          (
            SELECT display_name
            FROM users
            WHERE id = $2
          ) AS display_name,
          (
            SELECT avatar_emoji
            FROM users
            WHERE id = $2
          ) AS avatar_emoji,
          message,
          created_at
      `,
      [gameId, userId, message],
    );
  });
}

export async function leaveGame(gameId: number, userId: number): Promise<void> {
  await convertSeatToBot(gameId, userId, "left the game", false, true);
}

export async function markGameUserConnected(gameId: number, userId: number): Promise<void> {
  await db.none(
    `
      UPDATE game_users
      SET disconnected_at = NULL
      WHERE game_id = $1
        AND user_id = $2
        AND is_bot = FALSE
    `,
    [gameId, userId],
  );
}

export async function markGameUserDisconnected(gameId: number, userId: number): Promise<void> {
  await db.none(
    `
      UPDATE game_users
      SET disconnected_at = COALESCE(disconnected_at, CURRENT_TIMESTAMP)
      WHERE game_id = $1
        AND user_id = $2
        AND is_bot = FALSE
    `,
    [gameId, userId],
  );
}

export async function replaceDisconnectedUserWithBot(
  gameId: number,
  userId: number,
): Promise<boolean> {
  return convertSeatToBot(gameId, userId, "was replaced by a bot", true);
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

async function advanceAfterPlay(
  database: Queryable,
  game: Game,
  currentTrick: GameCardRow[],
  card: GameCardRow,
  seat: number,
  trickOrder: number,
): Promise<void> {
  const heartsBroken = game.hearts_broken || card.suit === "hearts";

  if (trickOrder < REQUIRED_PLAYERS) {
    const nextSeat = await nextOccupiedSeat(database, game.id, seat);
    await updateTurn(database, game.id, nextSeat, heartsBroken, null);
    return;
  }

  const finishedTrick = [...currentTrick, playedCardRow(card, game, trickOrder)];
  await resolveTrick(database, game, finishedTrick, heartsBroken);
}

async function allPlayersPassed(database: Queryable, gameId: number): Promise<boolean> {
  const row = await database.one<CountRow>(
    `
      SELECT COUNT(DISTINCT pass_from_seat)::int AS count
      FROM game_cards
      WHERE game_id = $1
        AND location = 'passing'
        AND pass_from_seat IS NOT NULL
    `,
    [gameId],
  );

  return row.count === REQUIRED_PLAYERS;
}

async function applyPassedCards(database: Queryable, gameId: number): Promise<void> {
  await database.none(
    `
      UPDATE game_cards gc
      SET location = 'hand',
          owner_seat = gc.pass_to_seat,
          user_id = gu.user_id
      FROM game_users gu
      WHERE gc.game_id = $1
        AND gc.location = 'passing'
        AND gc.pass_to_seat = gu.seat
        AND gc.game_id = gu.game_id
    `,
    [gameId],
  );
}

async function applyScores(database: Queryable, gameId: number): Promise<string> {
  const scores = await listScores(database, gameId);
  const shooter = scores.find((score) => score.hand_score === 26);

  if (shooter) {
    await database.none(
      `
        UPDATE game_users
        SET hand_score = CASE WHEN seat = $2 THEN 0 ELSE 26 END,
            total_score = total_score + CASE WHEN seat = $2 THEN 0 ELSE 26 END
        WHERE game_id = $1
      `,
      [gameId, shooter.seat],
    );
    return `Seat ${String(shooter.seat)} shot the moon.`;
  }

  await database.none(
    `
      UPDATE game_users
      SET total_score = total_score + hand_score
      WHERE game_id = $1
    `,
    [gameId],
  );

  return "Hand complete.";
}

async function beginPlayPhase(database: Queryable, game: Game, lastEvent: string): Promise<void> {
  const firstSeat = await findSeatHoldingCard(database, game.id, "clubs", "2");

  await database.none(
    `
      UPDATE games
      SET phase = 'playing',
          current_trick_no = 1,
          current_turn_seat = $2,
          lead_seat = $2,
          last_event = $3
      WHERE id = $1
    `,
    [game.id, firstSeat, lastEvent],
  );

  await logGameEvent(database, game, "system", lastEvent, firstSeat);
}

function buildStatusText(
  game: Game,
  players: GamePlayer[],
  currentUserSeat: number,
  hasPassed: boolean,
): string {
  if (game.status === "waiting") {
    return `Waiting for 4 players (${String(players.length)}/${String(REQUIRED_PLAYERS)}).`;
  }

  if (game.status === "finished") {
    return `Game finished. ${winnerText(players)}`;
  }

  if (game.phase === "passing") {
    return hasPassed
      ? "Cards passed. Waiting for the other players."
      : `Choose 3 cards to pass ${passDirectionLabel(game.pass_direction)}.`;
  }

  if (game.phase === "playing" && game.current_turn_seat === currentUserSeat) {
    return "Your turn.";
  }

  if (game.phase === "playing") {
    const currentPlayer = players.find((player) => player.seat === game.current_turn_seat);
    return `${currentPlayer?.display_name ?? "Another player"}'s turn.`;
  }

  return "Loading game.";
}

function canSeatPass(game: Game, hasPassed: boolean, handCount: number): boolean {
  return (
    game.status === "in_progress" &&
    game.phase === "passing" &&
    game.pass_direction !== "hold" &&
    !hasPassed &&
    handCount >= PASS_CARD_COUNT
  );
}

async function ensureGameMember(
  database: Queryable,
  gameId: number,
  userId: number,
): Promise<void> {
  const game = await findGameByIdOrNull(database, gameId);

  if (!game) {
    throw new GameActionError(404, "Game not found.");
  }

  const membership = await findUserSeat(database, gameId, userId);

  if (!membership) {
    throw new GameActionError(403, "You are not in this game.");
  }
}

async function delayBotAction(): Promise<void> {
  if (BOT_ACTION_DELAY_MS <= 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, BOT_ACTION_DELAY_MS);
  });
}

function envNumber(name: string, defaultValue: number): number {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue.trim() === "") {
    return defaultValue;
  }

  const value = Number(rawValue);

  return Number.isFinite(value) && value >= 0 ? value : defaultValue;
}

function cardPoints(card: GameCardRow): number {
  if (card.suit === "hearts") {
    return 1;
  }

  return isQueenOfSpades(card) ? 13 : 0;
}

async function completeHand(database: Queryable, game: Game, trickMessage: string): Promise<void> {
  const scoreMessage = await applyScores(database, game.id);
  const players = await listPlayers(database, game.id);

  await logGameEvent(database, game, "score", scoreMessage);

  if (players.some((player) => player.total_score >= game.target_score)) {
    await finishGame(database, game.id, `${trickMessage} ${scoreMessage} ${winnerText(players)}`);
    return;
  }

  const refreshedGame = await findGameForUpdate(database, game.id);
  await startNewHand(database, refreshedGame, players, `${trickMessage} ${scoreMessage}`);
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

async function convertSeatToBot(
  gameId: number,
  userId: number,
  reason: string,
  requireDisconnected = false,
  throwIfMissing = false,
): Promise<boolean> {
  return db.tx(async (t) => {
    const game = await findGameForUpdate(t, gameId);
    const membership = await findUserSeatForUpdate(t, gameId, userId);

    if (!membership) {
      if (throwIfMissing) {
        throw new GameActionError(403, "You are not in this game.");
      }

      return false;
    }

    if (membership.is_bot || game.status === "finished") {
      return false;
    }

    if (requireDisconnected && membership.disconnected_at === null) {
      return false;
    }

    const players = await listPlayers(t, gameId);
    const message = `${playerNameBySeat(players, membership.seat)} ${reason}.`;

    await t.none(
      `
        UPDATE game_users
        SET is_bot = TRUE,
            disconnected_at = COALESCE(disconnected_at, CURRENT_TIMESTAMP),
            left_at = COALESCE(left_at, CURRENT_TIMESTAMP)
        WHERE game_id = $1
          AND user_id = $2
      `,
      [gameId, userId],
    );

    await t.none(
      `
        UPDATE games
        SET last_event = $2
        WHERE id = $1
      `,
      [gameId, message],
    );

    await logGameEvent(
      t,
      game,
      "leave",
      `${message} Bot took over seat ${String(membership.seat)}.`,
      membership.seat,
      userId,
    );

    return true;
  });
}

async function dealCards(
  database: Queryable,
  gameId: number,
  players: GamePlayer[],
): Promise<void> {
  const deck = shuffle(await listDeckGameCardIds(database, gameId));

  for (const [index, player] of players.entries()) {
    const cardIds = deck.slice(index * CARDS_PER_PLAYER, (index + 1) * CARDS_PER_PLAYER);

    if (cardIds.length !== CARDS_PER_PLAYER) {
      throw new GameActionError(409, "Unable to deal a full Hearts hand.");
    }

    await database.none(
      `
        UPDATE game_cards
        SET location = 'hand',
            user_id = $<userId>,
            owner_seat = $<seat>
        WHERE id IN ($<cardIds:csv>)
      `,
      {
        cardIds,
        seat: player.seat,
        userId: player.user_id,
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
      SELECT ${gameColumns("g")}
      FROM games g
      INNER JOIN game_users gu ON gu.game_id = g.id
      WHERE gu.user_id = $1
        AND gu.is_bot = FALSE
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
      SELECT ${gameColumns()}
      FROM games
      WHERE id = $1
    `,
    [gameId],
  );
}

async function findGameForUpdate(database: Queryable, gameId: number): Promise<Game> {
  const game = await database.oneOrNone<Game>(
    `
      SELECT ${gameColumns()}
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

async function findHandRowsByIdsForUpdate(
  database: Queryable,
  gameId: number,
  seat: number,
  gameCardIds: number[],
): Promise<GameCardRow[]> {
  return database.manyOrNone<GameCardRow>(
    `
      ${gameCardSelectSql()}
      WHERE gc.game_id = $<gameId>
        AND gc.owner_seat = $<seat>
        AND gc.location = 'hand'
        AND gc.id IN ($<gameCardIds:csv>)
      ORDER BY c.sort_order ASC
      FOR UPDATE
    `,
    {
      gameCardIds,
      gameId,
      seat,
    },
  );
}

async function findJoinableGame(database: Queryable, userId: number): Promise<Game | null> {
  const game = await database.oneOrNone<Game>(
    `
      SELECT ${gameColumns("g")}
      FROM games g
      LEFT JOIN game_users gu ON gu.game_id = g.id
      WHERE g.status = 'waiting'
        AND NOT EXISTS (
          SELECT 1
          FROM game_users existing_gu
          WHERE existing_gu.game_id = g.id
            AND existing_gu.user_id = $1
        )
      GROUP BY g.id
      HAVING COUNT(gu.user_id) < g.max_players
      ORDER BY g.created_at ASC
      LIMIT 1
    `,
    [userId],
  );

  if (!game) {
    return null;
  }

  const lockedGame = await findGameForUpdate(database, game.id);

  if (lockedGame.status !== "waiting") {
    return null;
  }

  return (await countGameUsers(database, lockedGame.id)) < lockedGame.max_players
    ? lockedGame
    : null;
}

async function findSeatHoldingCard(
  database: Queryable,
  gameId: number,
  suit: CardSuit,
  rank: string,
): Promise<number> {
  const row = await database.oneOrNone<SeatRow>(
    `
      SELECT gc.owner_seat AS seat
      FROM game_cards gc
      INNER JOIN cards c ON c.id = gc.card_id
      WHERE gc.game_id = $1
        AND gc.location = 'hand'
        AND c.suit = $2
        AND c.rank = $3
      LIMIT 1
    `,
    [gameId, suit, rank],
  );

  if (!row) {
    throw new GameActionError(409, "Unable to find the two of clubs.");
  }

  return row.seat;
}

async function findUserIdForSeat(
  database: Queryable,
  gameId: number,
  seat: number,
): Promise<number> {
  const row = await database.oneOrNone<UserIdRow>(
    `
      SELECT user_id
      FROM game_users
      WHERE game_id = $1
        AND seat = $2
    `,
    [gameId, seat],
  );

  if (!row) {
    throw new GameActionError(409, "Pass target seat is empty.");
  }

  return row.user_id;
}

async function findUserSeat(
  database: Queryable,
  gameId: number,
  userId: number,
): Promise<MembershipRow | null> {
  return database.oneOrNone<MembershipRow>(
    `
      SELECT seat, is_bot, disconnected_at
      FROM game_users
      WHERE game_id = $1
        AND user_id = $2
        AND seat IS NOT NULL
    `,
    [gameId, userId],
  );
}

async function findUserSeatForUpdate(
  database: Queryable,
  gameId: number,
  userId: number,
): Promise<MembershipRow | null> {
  return database.oneOrNone<MembershipRow>(
    `
      SELECT seat, is_bot, disconnected_at
      FROM game_users
      WHERE game_id = $1
        AND user_id = $2
        AND seat IS NOT NULL
      FOR UPDATE
    `,
    [gameId, userId],
  );
}

function findPlayViolation(
  game: Game,
  hand: GameCardRow[],
  currentTrick: GameCardRow[],
  card: GameCardRow,
): string | null {
  if (currentTrick.length === 0) {
    return findLeadViolation(game, hand, card);
  }

  const leadCard = currentTrick.at(0);

  if (!leadCard) {
    return "Unable to determine the led suit.";
  }

  if (card.suit !== leadCard.suit && hand.some((candidate) => candidate.suit === leadCard.suit)) {
    return "You must follow suit.";
  }

  if (
    game.current_trick_no === 1 &&
    isPointCard(card) &&
    hand.some((candidate) => !isPointCard(candidate))
  ) {
    return "You cannot play hearts or the queen of spades on the first trick.";
  }

  return null;
}

function findLeadViolation(game: Game, hand: GameCardRow[], card: GameCardRow): string | null {
  if (game.current_trick_no === 1 && !isTwoOfClubs(card)) {
    return "The two of clubs must start the first trick.";
  }

  if (
    card.suit === "hearts" &&
    !game.hearts_broken &&
    hand.some((candidate) => candidate.suit !== "hearts")
  ) {
    return "Hearts have not been broken yet.";
  }

  return null;
}

async function finishGame(database: Queryable, gameId: number, lastEvent: string): Promise<void> {
  const game = await findGameById(database, gameId);

  await database.none(
    `
      UPDATE games
      SET status = 'finished',
          phase = 'finished',
          current_turn_seat = NULL,
          lead_seat = NULL,
          finished_at = CURRENT_TIMESTAMP,
          last_event = $2
      WHERE id = $1
    `,
    [gameId, lastEvent],
  );

  await logGameEvent(database, game, "system", lastEvent);
}

function gameCardSelectSql(): string {
  return `
    SELECT
      gc.id AS game_card_id,
      c.id AS card_id,
      c.suit,
      c.rank,
      c.label,
      gc.location,
      gc.user_id,
      gc.owner_seat,
      gc.played_order,
      gc.played_at,
      gc.trick_no,
      gc.trick_order,
      gc.taken_by_seat
    FROM game_cards gc
    INNER JOIN cards c ON c.id = gc.card_id
  `;
}

function gameColumns(alias?: string): string {
  const prefix = alias ? `${alias}.` : "";

  return `
    ${prefix}id,
    ${prefix}status,
    ${prefix}phase,
    ${prefix}created_at,
    ${prefix}max_players,
    ${prefix}started_at,
    ${prefix}current_turn_seat,
    ${prefix}current_hand_no,
    ${prefix}current_trick_no,
    ${prefix}lead_seat,
    ${prefix}hearts_broken,
    ${prefix}pass_direction,
    ${prefix}finished_at,
    ${prefix}last_event,
    ${prefix}target_score
  `;
}

async function hasSeatPassed(database: Queryable, gameId: number, seat: number): Promise<boolean> {
  const row = await database.one<CountRow>(
    `
      SELECT COUNT(*)::int AS count
      FROM game_cards
      WHERE game_id = $1
        AND location = 'passing'
        AND pass_from_seat = $2
    `,
    [gameId, seat],
  );

  return row.count > 0;
}

async function insertGame(database: Queryable): Promise<Game> {
  return database.one<Game>(
    `
      INSERT INTO games DEFAULT VALUES
      RETURNING ${gameColumns()}
    `,
  );
}

function isPointCard(card: GameCardRow): boolean {
  return card.suit === "hearts" || isQueenOfSpades(card);
}

function isQueenOfSpades(card: GameCardRow): boolean {
  return card.suit === "spades" && card.rank === "Q";
}

function isTwoOfClubs(card: GameCardRow): boolean {
  return card.suit === "clubs" && card.rank === "2";
}

async function listCurrentTrickRows(database: Queryable, game: Game): Promise<GameCardRow[]> {
  if (game.current_trick_no === 0) {
    return [];
  }

  return database.manyOrNone<GameCardRow>(
    `
      ${gameCardSelectSql()}
      WHERE gc.game_id = $1
        AND gc.location = 'trick'
        AND gc.trick_no = $2
      ORDER BY gc.trick_order ASC
    `,
    [game.id, game.current_trick_no],
  );
}

async function listDeckGameCardIds(database: Queryable, gameId: number): Promise<number[]> {
  const rows = await database.manyOrNone<IdRow>(
    `
      SELECT id
      FROM game_cards
      WHERE game_id = $1
      ORDER BY id ASC
    `,
    [gameId],
  );

  return rows.map((row) => row.id);
}

async function listHandRows(
  database: Queryable,
  gameId: number,
  seat: number,
): Promise<GameCardRow[]> {
  return database.manyOrNone<GameCardRow>(
    `
      ${gameCardSelectSql()}
      WHERE gc.game_id = $1
        AND gc.owner_seat = $2
        AND gc.location = 'hand'
      ORDER BY c.sort_order ASC
    `,
    [gameId, seat],
  );
}

async function listHandRowsForUpdate(
  database: Queryable,
  gameId: number,
  seat: number,
): Promise<GameCardRow[]> {
  return database.manyOrNone<GameCardRow>(
    `
      ${gameCardSelectSql()}
      WHERE gc.game_id = $1
        AND gc.owner_seat = $2
        AND gc.location = 'hand'
      ORDER BY c.sort_order ASC
      FOR UPDATE
    `,
    [gameId, seat],
  );
}

async function listRecentGameEvents(database: Queryable, gameId: number): Promise<GameEvent[]> {
  return database.manyOrNone<GameEvent>(
    `
      SELECT
        id,
        game_id,
        hand_no,
        trick_no,
        actor_seat,
        actor_user_id,
        event_type,
        message,
        created_at
      FROM (
        SELECT
          id,
          game_id,
          hand_no,
          trick_no,
          actor_seat,
          actor_user_id,
          event_type,
          message,
          created_at
        FROM game_events
        WHERE game_id = $1
        ORDER BY id DESC
        LIMIT $2
      ) recent
      ORDER BY id ASC
    `,
    [gameId, MOVE_LOG_LIMIT],
  );
}

async function listRecentChatMessages(
  database: Queryable,
  gameId: number,
): Promise<GameChatMessage[]> {
  return database.manyOrNone<GameChatMessage>(
    `
      SELECT
        id,
        game_id,
        user_id,
        display_name,
        avatar_emoji,
        message,
        created_at
      FROM (
        SELECT
          gcm.id,
          gcm.game_id,
          gcm.user_id,
          u.display_name,
          u.avatar_emoji,
          gcm.message,
          gcm.created_at
        FROM game_chat_messages gcm
        LEFT JOIN users u ON u.id = gcm.user_id
        WHERE gcm.game_id = $1
        ORDER BY gcm.created_at DESC, gcm.id DESC
        LIMIT $2
      ) recent
      ORDER BY created_at ASC, id ASC
    `,
    [gameId, CHAT_MESSAGE_LIMIT],
  );
}

async function listPlayers(database: Queryable, gameId: number): Promise<GamePlayer[]> {
  return database.manyOrNone<GamePlayer>(
    `
      SELECT
        gu.user_id,
        u.display_name,
        u.avatar_emoji,
        gu.seat,
        gu.total_score,
        gu.hand_score,
        gu.is_bot,
        gu.disconnected_at,
        gu.left_at,
        EXISTS (
          SELECT 1
          FROM game_cards gc
          WHERE gc.game_id = gu.game_id
            AND gc.location = 'passing'
            AND gc.pass_from_seat = gu.seat
        ) AS has_passed
      FROM game_users gu
      INNER JOIN users u ON u.id = gu.user_id
      WHERE gu.game_id = $1
        AND gu.seat IS NOT NULL
      ORDER BY gu.seat ASC
    `,
    [gameId],
  );
}

async function listScores(database: Queryable, gameId: number): Promise<ScoreRow[]> {
  return database.manyOrNone<ScoreRow>(
    `
      SELECT seat, hand_score, total_score
      FROM game_users
      WHERE game_id = $1
        AND seat IS NOT NULL
      ORDER BY seat ASC
    `,
    [gameId],
  );
}

function markPlayableCards(
  game: Game,
  hand: GameCardRow[],
  currentTrick: GameCardRow[],
  currentUserSeat: number,
  canControlSeat: boolean,
): GameCard[] {
  const isUsersTurn =
    canControlSeat && game.phase === "playing" && game.current_turn_seat === currentUserSeat;

  return hand.map((card) => ({
    ...card,
    is_playable: isUsersTurn && findPlayViolation(game, hand, currentTrick, card) === null,
  }));
}

async function markCardsForPassing(
  database: Queryable,
  game: Game,
  fromSeat: number,
  gameCardIds: number[],
): Promise<void> {
  const toSeat = passTargetSeat(game.pass_direction, fromSeat);
  const targetUserId = await findUserIdForSeat(database, game.id, toSeat);

  await database.none(
    `
      UPDATE game_cards
      SET location = 'passing',
          user_id = $<targetUserId>,
          pass_from_seat = $<fromSeat>,
          pass_to_seat = $<toSeat>,
          passed_at = CURRENT_TIMESTAMP
      WHERE id IN ($<gameCardIds:csv>)
        AND game_id = $<gameId>
    `,
    {
      fromSeat,
      gameCardIds,
      gameId: game.id,
      targetUserId,
      toSeat,
    },
  );
}

async function reclaimBotSeat(database: Queryable, userId: number): Promise<Game | null> {
  const row = await database.oneOrNone<SeatRow & { game_id: number }>(
    `
      SELECT gu.game_id, gu.seat
      FROM game_users gu
      INNER JOIN games g ON g.id = gu.game_id
      WHERE gu.user_id = $1
        AND gu.is_bot = TRUE
        AND g.status IN ('waiting', 'in_progress')
      ORDER BY gu.left_at DESC NULLS LAST, g.created_at DESC
      LIMIT 1
    `,
    [userId],
  );

  if (!row) {
    return null;
  }

  const game = await findGameForUpdate(database, row.game_id);

  if (game.status === "finished") {
    return null;
  }

  const membership = await findUserSeatForUpdate(database, row.game_id, userId);

  if (!membership?.is_bot) {
    return null;
  }

  await database.none(
    `
      UPDATE game_users
      SET is_bot = FALSE,
          disconnected_at = NULL,
          left_at = NULL
      WHERE game_id = $1
        AND user_id = $2
    `,
    [row.game_id, userId],
  );

  const players = await listPlayers(database, row.game_id);
  const message = `${playerNameBySeat(players, membership.seat)} rejoined seat ${String(
    membership.seat,
  )}.`;

  await database.none(
    `
      UPDATE games
      SET last_event = $2
      WHERE id = $1
    `,
    [row.game_id, message],
  );

  await logGameEvent(database, game, "system", message, membership.seat, userId);

  return findGameById(database, row.game_id);
}

async function logCardPlayed(
  database: Queryable,
  game: Game,
  seat: number,
  userId: number,
  card: GameCardRow,
  players?: GamePlayer[],
): Promise<void> {
  const tablePlayers = players ?? (await listPlayers(database, game.id));

  await logGameEvent(
    database,
    game,
    "play",
    `${playerLogNameBySeat(tablePlayers, seat)} played ${card.label}.`,
    seat,
    userId,
  );
}

async function logGameEvent(
  database: Queryable,
  game: Game,
  eventType: GameEventType,
  message: string,
  actorSeat: number | null = null,
  actorUserId: number | null = null,
): Promise<void> {
  await database.none(
    `
      INSERT INTO game_events (
        game_id,
        hand_no,
        trick_no,
        actor_seat,
        actor_user_id,
        event_type,
        message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      game.id,
      game.current_hand_no,
      game.current_trick_no > 0 ? game.current_trick_no : null,
      actorSeat,
      actorUserId,
      eventType,
      message,
    ],
  );
}

async function maybeStartGame(database: Queryable, gameId: number): Promise<void> {
  const game = await findGameForUpdate(database, gameId);

  if (game.status !== "waiting") {
    return;
  }

  const players = await listPlayers(database, gameId);

  if (players.length < REQUIRED_PLAYERS) {
    return;
  }

  await startNewHand(database, game, players, "Game started.");
}

export async function runBotsForGame(
  gameId: number,
  onBotAction?: BotActionCallback,
): Promise<void> {
  if (runningBotGames.has(gameId)) {
    return;
  }

  runningBotGames.add(gameId);

  try {
    for (let actionCount = 0; actionCount < BOT_ACTION_LIMIT; actionCount += 1) {
      await delayBotAction();

      const acted = await runSingleBotAction(gameId);

      if (!acted) {
        return;
      }

      await onBotAction?.(gameId);
    }

    console.warn(`Bot action limit reached for game ${String(gameId)}.`);
  } finally {
    runningBotGames.delete(gameId);
  }
}

export async function runHumanTimeoutAction(gameId: number): Promise<boolean> {
  return db.tx(async (t) => {
    const game = await findGameForUpdate(t, gameId);

    if (game.status !== "in_progress") {
      return false;
    }

    const players = await listPlayers(t, gameId);

    if (game.phase === "passing") {
      return runHumanTimeoutPassAction(t, game, players);
    }

    if (game.phase === "playing") {
      return runHumanTimeoutPlayAction(t, game, players);
    }

    return false;
  });
}

async function runSingleBotAction(gameId: number): Promise<boolean> {
  return db.tx(async (t) => {
    const game = await findGameForUpdate(t, gameId);

    if (game.status !== "in_progress") {
      return false;
    }

    const players = await listPlayers(t, gameId);

    if (game.phase === "passing") {
      return runBotPassAction(t, game, players);
    }

    if (game.phase === "playing") {
      return runBotPlayAction(t, game, players);
    }

    return false;
  });
}

async function runBotPassAction(
  database: Queryable,
  game: Game,
  players: GamePlayer[],
): Promise<boolean> {
  const bot = players.find((player) => player.is_bot && !player.has_passed);

  if (!bot || game.pass_direction === "hold") {
    return false;
  }

  const hand = await listHandRowsForUpdate(database, game.id, bot.seat);
  const gameCardIds = selectBotPassCards(hand);

  if (gameCardIds.length !== PASS_CARD_COUNT) {
    return false;
  }

  await markCardsForPassing(database, game, bot.seat, gameCardIds);
  await logGameEvent(
    database,
    game,
    "pass",
    `${playerLogNameBySeat(players, bot.seat)} passed ${String(PASS_CARD_COUNT)} cards ${passDirectionLabel(
      game.pass_direction,
    )}.`,
    bot.seat,
    bot.user_id,
  );

  if (await allPlayersPassed(database, game.id)) {
    await applyPassedCards(database, game.id);
    await beginPlayPhase(database, game, "All players passed. The two of clubs leads.");
  }

  return true;
}

async function runHumanTimeoutPassAction(
  database: Queryable,
  game: Game,
  players: GamePlayer[],
): Promise<boolean> {
  const human = players.find(
    (player) => !player.is_bot && player.disconnected_at === null && !player.has_passed,
  );

  if (!human || game.pass_direction === "hold") {
    return false;
  }

  const hand = await listHandRowsForUpdate(database, game.id, human.seat);
  const gameCardIds = selectBotPassCards(hand);

  if (gameCardIds.length !== PASS_CARD_COUNT) {
    return false;
  }

  await markCardsForPassing(database, game, human.seat, gameCardIds);
  await logGameEvent(
    database,
    game,
    "pass",
    `${playerLogNameBySeat(players, human.seat)} timed out and auto-passed ${String(
      PASS_CARD_COUNT,
    )} cards.`,
    human.seat,
    human.user_id,
  );

  if (await allPlayersPassed(database, game.id)) {
    await applyPassedCards(database, game.id);
    await beginPlayPhase(database, game, "All players passed. The two of clubs leads.");
  }

  return true;
}

async function runBotPlayAction(
  database: Queryable,
  game: Game,
  players: GamePlayer[],
): Promise<boolean> {
  const currentPlayer = players.find((player) => player.seat === game.current_turn_seat);

  if (!currentPlayer?.is_bot) {
    return false;
  }

  const hand = await listHandRowsForUpdate(database, game.id, currentPlayer.seat);
  const currentTrick = await listCurrentTrickRows(database, game);
  const card = selectBotPlayableCard(game, hand, currentTrick);

  if (!card) {
    return false;
  }

  const trickOrder = currentTrick.length + 1;
  const playedOrder = await nextPlayedOrder(database, game.id);

  await moveCardToTrick(database, game, card, trickOrder, playedOrder);
  await logCardPlayed(database, game, currentPlayer.seat, currentPlayer.user_id, card, players);
  await advanceAfterPlay(database, game, currentTrick, card, currentPlayer.seat, trickOrder);

  return true;
}

async function runHumanTimeoutPlayAction(
  database: Queryable,
  game: Game,
  players: GamePlayer[],
): Promise<boolean> {
  const currentPlayer = players.find((player) => player.seat === game.current_turn_seat);

  if (!currentPlayer || currentPlayer.is_bot || currentPlayer.disconnected_at !== null) {
    return false;
  }

  const hand = await listHandRowsForUpdate(database, game.id, currentPlayer.seat);
  const currentTrick = await listCurrentTrickRows(database, game);
  const card = selectBotPlayableCard(game, hand, currentTrick);

  if (!card) {
    return false;
  }

  const trickOrder = currentTrick.length + 1;
  const playedOrder = await nextPlayedOrder(database, game.id);

  await moveCardToTrick(database, game, card, trickOrder, playedOrder);
  await logGameEvent(
    database,
    game,
    "play",
    `${playerLogNameBySeat(players, currentPlayer.seat)} timed out and auto-played ${card.label}.`,
    currentPlayer.seat,
    currentPlayer.user_id,
  );
  await advanceAfterPlay(database, game, currentTrick, card, currentPlayer.seat, trickOrder);

  return true;
}

async function moveCardToTrick(
  database: Queryable,
  game: Game,
  card: GameCardRow,
  trickOrder: number,
  playedOrder: number,
): Promise<void> {
  await database.none(
    `
      UPDATE game_cards
      SET location = 'trick',
          trick_no = $2,
          trick_order = $3,
          played_order = $4,
          played_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [card.game_card_id, game.current_trick_no, trickOrder, playedOrder],
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

function passDirectionForHand(handNo: number): PassDirection {
  const directions: PassDirection[] = ["left", "right", "across", "hold"];
  return directions[(handNo - 1) % directions.length] ?? "left";
}

function passDirectionLabel(direction: PassDirection): string {
  if (direction === "hold") {
    return "nowhere";
  }

  return direction;
}

function passTargetSeat(direction: PassDirection, seat: number): number {
  if (direction === "left") {
    return wrapSeat(seat + 1);
  }

  if (direction === "right") {
    return wrapSeat(seat - 1);
  }

  if (direction === "across") {
    return wrapSeat(seat + 2);
  }

  return seat;
}

function playedCardRow(card: GameCardRow, game: Game, trickOrder: number): GameCardRow {
  return {
    ...card,
    location: "trick",
    trick_no: game.current_trick_no,
    trick_order: trickOrder,
  };
}

function playerNameBySeat(players: GamePlayer[], seat: number): string {
  return players.find((player) => player.seat === seat)?.display_name ?? `Seat ${String(seat)}`;
}

function playerLogNameBySeat(players: GamePlayer[], seat: number): string {
  const player = players.find((candidate) => candidate.seat === seat);

  if (!player) {
    return `Seat ${String(seat)}`;
  }

  return player.is_bot ? `${player.display_name} Bot` : player.display_name;
}

function rankValue(card: GameCardRow): number {
  const values: Record<string, number> = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };

  return values[card.rank] ?? 0;
}

function selectBotPassCards(hand: GameCardRow[]): number[] {
  return [...hand]
    .sort((left, right) => botPassScore(right) - botPassScore(left))
    .slice(0, PASS_CARD_COUNT)
    .map((card) => card.game_card_id);
}

function selectBotPlayableCard(
  game: Game,
  hand: GameCardRow[],
  currentTrick: GameCardRow[],
): GameCardRow | null {
  const playableCards = hand.filter(
    (card) => findPlayViolation(game, hand, currentTrick, card) === null,
  );

  return (
    playableCards
      .sort(
        (left, right) =>
          botPlayScore(left) - botPlayScore(right) || rankValue(left) - rankValue(right),
      )
      .at(0) ?? null
  );
}

function botPassScore(card: GameCardRow): number {
  if (isQueenOfSpades(card)) {
    return 100;
  }

  if (card.suit === "hearts") {
    return 40 + rankValue(card);
  }

  return rankValue(card);
}

function botPlayScore(card: GameCardRow): number {
  return cardPoints(card) * 20 + rankValue(card);
}

async function resetCardsForNewHand(database: Queryable, gameId: number): Promise<void> {
  await database.none(
    `
      UPDATE game_cards
      SET location = 'deck',
          user_id = NULL,
          owner_seat = NULL,
          played_order = NULL,
          played_at = NULL,
          trick_no = NULL,
          trick_order = NULL,
          taken_by_seat = NULL,
          pass_from_seat = NULL,
          pass_to_seat = NULL,
          passed_at = NULL
      WHERE game_id = $1
    `,
    [gameId],
  );
}

async function resolveTrick(
  database: Queryable,
  game: Game,
  trickCards: GameCardRow[],
  heartsBroken: boolean,
): Promise<void> {
  const winnerSeat = winningSeat(trickCards);
  const points = trickCards.reduce((total, card) => total + cardPoints(card), 0);

  await database.none(
    `
      UPDATE game_cards
      SET location = 'taken',
          taken_by_seat = $3
      WHERE game_id = $1
        AND trick_no = $2
    `,
    [game.id, game.current_trick_no, winnerSeat],
  );

  await database.none(
    `
      UPDATE game_users
      SET hand_score = hand_score + $3
      WHERE game_id = $1
        AND seat = $2
    `,
    [game.id, winnerSeat, points],
  );

  await resolveTrickOutcome(database, game, winnerSeat, points, heartsBroken);
}

async function resolveTrickOutcome(
  database: Queryable,
  game: Game,
  winnerSeat: number,
  points: number,
  heartsBroken: boolean,
): Promise<void> {
  const players = await listPlayers(database, game.id);
  const winnerName = playerLogNameBySeat(players, winnerSeat);
  const message = `${winnerName} took trick ${String(game.current_trick_no)} for ${String(points)} points.`;
  const handFinished = await isCurrentHandFinished(database, game.id);

  await logGameEvent(database, game, "trick", message, winnerSeat);

  if (handFinished) {
    await completeHand(database, game, message);
    return;
  }

  await database.none(
    `
      UPDATE games
      SET current_trick_no = current_trick_no + 1,
          current_turn_seat = $2,
          lead_seat = $2,
          hearts_broken = $3,
          last_event = $4
      WHERE id = $1
    `,
    [game.id, winnerSeat, heartsBroken, message],
  );
}

async function isCurrentHandFinished(database: Queryable, gameId: number): Promise<boolean> {
  const row = await database.one<CountRow>(
    `
      SELECT COUNT(*)::int AS count
      FROM game_cards
      WHERE game_id = $1
        AND location IN ('hand', 'passing', 'trick')
    `,
    [gameId],
  );

  return row.count === 0;
}

function shuffle(items: number[]): number[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const otherIndex = randomInt(index + 1);
    const current = copy[index];
    const other = copy[otherIndex];

    if (current === undefined || other === undefined) {
      throw new GameActionError(409, "Unable to shuffle the deck.");
    }

    copy[index] = other;
    copy[otherIndex] = current;
  }

  return copy;
}

async function startNewHand(
  database: Queryable,
  game: Game,
  players: GamePlayer[],
  previousEvent: string,
): Promise<void> {
  if (players.length !== REQUIRED_PLAYERS) {
    throw new GameActionError(409, "Hearts requires exactly four players.");
  }

  const handNo = game.current_hand_no + 1;
  const passDirection = passDirectionForHand(handNo);

  await database.none("UPDATE game_users SET hand_score = 0 WHERE game_id = $1", [game.id]);
  await ensureDeckRows(database, game.id);
  await resetCardsForNewHand(database, game.id);
  await dealCards(database, game.id, players);

  if (passDirection === "hold") {
    await startHoldHand(database, game, handNo, `${previousEvent} Hold hand. No pass.`);
    return;
  }

  const lastEvent = `${previousEvent} New hand dealt.`;

  await database.none(
    `
      UPDATE games
      SET status = 'in_progress',
          phase = 'passing',
          started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
          current_hand_no = $2,
          current_trick_no = 0,
          current_turn_seat = NULL,
          lead_seat = NULL,
          hearts_broken = FALSE,
          pass_direction = $3,
          last_event = $4
      WHERE id = $1
    `,
    [game.id, handNo, passDirection, lastEvent],
  );

  await logGameEvent(
    database,
    { ...game, current_hand_no: handNo, current_trick_no: 0 },
    "system",
    `Hand ${String(handNo)} dealt. Pass ${String(PASS_CARD_COUNT)} cards ${passDirectionLabel(
      passDirection,
    )}.`,
  );
}

async function startHoldHand(
  database: Queryable,
  game: Game,
  handNo: number,
  lastEvent: string,
): Promise<void> {
  await database.none(
    `
      UPDATE games
      SET status = 'in_progress',
          phase = 'playing',
          started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
          current_hand_no = $2,
          current_trick_no = 1,
          current_turn_seat = NULL,
          lead_seat = NULL,
          hearts_broken = FALSE,
          pass_direction = 'hold',
          last_event = $3
      WHERE id = $1
    `,
    [game.id, handNo, lastEvent],
  );

  const refreshedGame = await findGameForUpdate(database, game.id);
  await beginPlayPhase(database, refreshedGame, lastEvent);
}

async function updateTurn(
  database: Queryable,
  gameId: number,
  nextSeat: number,
  heartsBroken: boolean,
  lastEvent: string | null,
): Promise<void> {
  await database.none(
    `
      UPDATE games
      SET current_turn_seat = $2,
          hearts_broken = $3,
          last_event = COALESCE($4, last_event)
      WHERE id = $1
    `,
    [gameId, nextSeat, heartsBroken, lastEvent],
  );
}

function validatePassRequest(game: Game, gameCardIds: number[]): void {
  if (game.status !== "in_progress" || game.phase !== "passing") {
    throw new GameActionError(409, "Cards can only be passed during the passing phase.");
  }

  if (game.pass_direction === "hold") {
    throw new GameActionError(409, "This hand has no passing phase.");
  }

  if (gameCardIds.length !== PASS_CARD_COUNT) {
    throw new GameActionError(400, "Choose exactly three cards to pass.");
  }

  if (new Set(gameCardIds).size !== PASS_CARD_COUNT) {
    throw new GameActionError(400, "Choose three different cards to pass.");
  }
}

function validateChatMessage(rawMessage: string): string {
  const message = rawMessage.trim();

  if (message.length === 0) {
    throw new GameActionError(400, "Chat message cannot be empty.");
  }

  if (message.length > CHAT_MESSAGE_MAX_LENGTH) {
    throw new GameActionError(
      400,
      `Chat message must be ${String(CHAT_MESSAGE_MAX_LENGTH)} characters or fewer.`,
    );
  }

  return message;
}

function validatePlayTurn(game: Game, seat: number): void {
  if (game.status !== "in_progress" || game.phase !== "playing") {
    throw new GameActionError(409, "Cards can only be played during the play phase.");
  }

  if (game.current_turn_seat !== seat) {
    throw new GameActionError(409, "It is not your turn.");
  }
}

function winnerText(players: GamePlayer[]): string {
  const lowestScore = Math.min(...players.map((player) => player.total_score));
  const winners = players
    .filter((player) => player.total_score === lowestScore)
    .map((player) => player.display_name)
    .join(", ");

  return `Winner: ${winners}.`;
}

function winningSeat(trickCards: GameCardRow[]): number {
  const leadCard = trickCards.at(0);

  if (!leadCard) {
    throw new GameActionError(409, "Cannot resolve an empty trick.");
  }

  const winningCard = trickCards
    .filter((card) => card.suit === leadCard.suit)
    .reduce((best, card) => (rankValue(card) > rankValue(best) ? card : best), leadCard);

  if (winningCard.owner_seat === null) {
    throw new GameActionError(409, "Cannot resolve a trick without card owners.");
  }

  return winningCard.owner_seat;
}

function wrapSeat(seat: number): number {
  if (seat < 1) {
    return seat + REQUIRED_PLAYERS;
  }

  if (seat > REQUIRED_PLAYERS) {
    return seat - REQUIRED_PLAYERS;
  }

  return seat;
}
