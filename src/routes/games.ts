import { Router, type Request, type Response } from "express";
import { createGame, listGames } from "../db/games.js";

export const gamesRouter = Router();

async function handleGetGames(request: Request, response: Response): Promise<void> {
  if (!request.session.user) {
    response.status(401).json({
      error: "Not authenticated.",
    });
    return;
  }

  const games = await listGames();

  response.status(200).json({
    games,
  });
}

async function handlePostGames(request: Request, response: Response): Promise<void> {
  if (!request.session.user) {
    response.status(401).json({
      error: "Not authenticated.",
    });
    return;
  }

  const userId = request.session.user.id;
  const game = await createGame(userId);

  response.status(201).json(game);
}

gamesRouter.get("/", (request, response, next) => {
  void handleGetGames(request, response).catch(next);
});

gamesRouter.post("/", (request, response, next) => {
  void handlePostGames(request, response).catch(next);
});
