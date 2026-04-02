/**
 * DB Layer: Games
 *
 * This file is responsible for all database operations related to games.
 *
 * TODO Jonathan:
 * Implement the functions below using pg-promise.
 *
 * Guidelines:
 * - Follow the same pattern used in users.ts
 * - Use parameterized queries (no string interpolation)
 * - Keep logic focused on DB access only (no business logic)
 * - See docs/examples for migration structure and expected schema
 *
 * M8 Scope:
 * - Only support basic game creation and listing
 * - Do NOT include gameplay logic yet
 */

/**
 * Creates a new game and inserts the creator into game_users.
 *
 * Requirements:
 * 1. Insert a new row into the "games" table
 *    - Use default values
 *    - status should default to "waiting"
 *
 * 2. Insert the creator into "game_users"
 *    - game_id = newly created game id
 *    - user_id = provided userId
 *    - joined_at = default timestamp
 *
 * Notes:
 * - Creator/host is NOT stored explicitly
 * - It is derived later from the earliest joined_at
 */
export function createGame(_userId: number): Promise<void> {
  throw new Error("Not implemented.");
}

/**
 * Returns all games for the lobby view.
 *
 * Requirements:
 * - Return a list of games with relevant information for display
 *
 * Notes:
 * - Data may come from multiple tables
 * - Order results by created_at DESC (newest first)
 */
export function listGames(): Promise<void> {
  throw new Error("Not implemented.");
}
