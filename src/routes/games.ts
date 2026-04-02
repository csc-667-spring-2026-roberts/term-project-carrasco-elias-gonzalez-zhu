import { Router } from "express";

export const gamesRouter = Router();

/**
 * API Layer: Games
 *
 * TODO Marbella:
 * Implement the routes for game creation and listing.
 *
 * Guidelines:
 * - Use functions from src/db/games.ts
 * - Keep routes focused on request/response handling
 * - Do NOT write SQL here (that belongs in the DB layer)
 *
 * M8 Endpoints:
 *
 * 1. GET /api/games
 *    - Return all games for the lobby
 *    - Response format:
 *      { games: [...] }
 *
 * 2. POST /api/games
 *    - Create a new game
 *    - Requires authenticated user
 *    - Use user id from session (req.session.user.id)
 *    - Return created game as JSON
 *
 * Notes:
 * - These endpoints are temporary for M8 (used by frontend fetch)
 * - Later milestones will replace this with real-time updates
 *
 * Hint:
 * - Define a GET route for listing games
 * - Define a POST route for creating a game
 */
