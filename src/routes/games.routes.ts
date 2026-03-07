import { Router, type Request, type Response } from "express";
// import { db } from "../db/connection.js"; // Jonathan will enable this (M5)

export const gamesRouter = Router();

/**
 * GET /api/games
 *
 * Expected Response (200 OK once implemented):
 * [
 *   {
 *     id: number,
 *     name: string,
 *     status: string,
 *     created_at: string
 *   }
 * ]
 *
 * Note:
 * Schema defined in database/smoke.sql:
 * games(id, name, status, created_at)
 *
 * Stub: returns 501 until DB integration is implemented.
 */
gamesRouter.get("/", (_req: Request, res: Response): void => {
  res.status(501).json({
    error: "Not Implemented",
    message: "DB integration pending (M5).",
  });
});

/**
 * POST /api/games
 *
 * Request Body (application/json):
 * {
 *   "name": string,
 *   "status": string
 * }
 *
 * Expected Responses (once implemented):
 * 201 Created → inserted row returned
 * 400 Bad Request → missing name or status
 *
 * Stub: returns 501 until DB integration is implemented.
 */
gamesRouter.post("/", (_req: Request, res: Response): void => {
  res.status(501).json({
    error: "Not Implemented",
    message: "DB integration pending (M5).",
  });
});
