import { Router, type Request, type Response } from "express";
import { db } from "../../database/connection.js";

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
 */
gamesRouter.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const games = await db.any<{
      id: number;
      name: string;
      status: string;
      created_at: Date;
    }>("SELECT id, name, status, created_at FROM games ORDER BY id ASC");

    res.status(200).json(games);
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch games.",
    });
  }
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
 */
gamesRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as {
    name?: unknown;
    status?: unknown;
  };

  const name = body.name;
  const status = body.status;

  if (typeof name !== "string" || typeof status !== "string") {
    res.status(400).json({
      error: "Bad Request",
      message: "Both 'name' and 'status' are required and must be strings.",
    });
    return;
  }

  try {
    const insertedGame = await db.one<{
      id: number;
      name: string;
      status: string;
      created_at: Date;
    }>("INSERT INTO games(name, status) VALUES($1, $2) RETURNING id, name, status, created_at", [
      name,
      status,
    ]);

    res.status(201).json(insertedGame);
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create game.",
    });
  }
});
