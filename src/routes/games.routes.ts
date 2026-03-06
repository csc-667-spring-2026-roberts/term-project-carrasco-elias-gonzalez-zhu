import { Router, type Request, type Response } from "express";
// import { db } from "../db/connection.js"; // Jonathan will enable this

export const gamesRouter = Router();

/**
 * GET /api/games
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
 * Body: { status: string }
 * Stub: returns 501 until DB integration is implemented.
 */
gamesRouter.post("/", (_req: Request, res: Response): void => {
  res.status(501).json({
    error: "Not Implemented",
    message: "DB integration pending (M5).",
  });
});
