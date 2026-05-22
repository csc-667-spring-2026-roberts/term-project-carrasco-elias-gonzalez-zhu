import { Router, type Request, type Response } from "express";
import {
  GameActionError,
  getGameState,
  joinOrCreateGame,
  leaveGame,
  listGames,
  passCards,
  playCard,
} from "../db/games.js";
import { broadcastSse } from "./sse.js";

export const gamesRouter = Router();

interface PlayCardRequestBody {
  gameCardId?: unknown;
}

interface PassCardsRequestBody {
  gameCardIds?: unknown;
}

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
  const game = await joinOrCreateGame(userId);

  const games = await listGames();

  broadcastSse({
    type: "games_updated",
    games,
  });

  broadcastSse({
    type: "game_updated",
    gameId: game.id,
  });

  response.status(201).json({
    game,
  });
}

async function handleGetGameState(request: Request, response: Response): Promise<void> {
  if (!request.session.user) {
    response.status(401).json({
      error: "Not authenticated.",
    });
    return;
  }

  const gameId = Number(request.params.id);

  if (!Number.isInteger(gameId)) {
    response.status(400).json({
      error: "Invalid game id.",
    });
    return;
  }

  const state = await getGameState(gameId, request.session.user.id);

  response.status(200).json({
    state,
  });
}

async function handlePostPlayCard(request: Request, response: Response): Promise<void> {
  if (!request.session.user) {
    response.status(401).json({
      error: "Not authenticated.",
    });
    return;
  }

  const gameId = Number(request.params.id);
  const body = request.body as PlayCardRequestBody;
  const gameCardId = Number(body.gameCardId);

  if (!Number.isInteger(gameId) || !Number.isInteger(gameCardId)) {
    response.status(400).json({
      error: "Invalid card play request.",
    });
    return;
  }

  await playCard(gameId, request.session.user.id, gameCardId);

  const state = await getGameState(gameId, request.session.user.id);

  broadcastSse({
    type: "game_updated",
    gameId,
  });

  response.status(200).json({
    state,
  });
}

async function handlePostPassCards(request: Request, response: Response): Promise<void> {
  if (!request.session.user) {
    response.status(401).json({
      error: "Not authenticated.",
    });
    return;
  }

  const gameId = Number(request.params.id);
  const body = request.body as PassCardsRequestBody;
  const gameCardIds = parseGameCardIds(body.gameCardIds);

  if (!Number.isInteger(gameId) || gameCardIds === null) {
    response.status(400).json({
      error: "Invalid card pass request.",
    });
    return;
  }

  await passCards(gameId, request.session.user.id, gameCardIds);

  const state = await getGameState(gameId, request.session.user.id);

  broadcastSse({
    type: "game_updated",
    gameId,
  });

  response.status(200).json({
    state,
  });
}

async function handlePostLeaveGame(request: Request, response: Response): Promise<void> {
  if (!request.session.user) {
    response.status(401).json({
      error: "Not authenticated.",
    });
    return;
  }

  const gameId = Number(request.params.id);

  if (!Number.isInteger(gameId)) {
    response.status(400).json({
      error: "Invalid game id.",
    });
    return;
  }

  await leaveGame(gameId, request.session.user.id);

  const games = await listGames();

  broadcastSse({
    type: "game_updated",
    gameId,
  });

  broadcastSse({
    type: "games_updated",
    games,
  });

  response.status(200).json({
    message: "Seat converted to bot.",
  });
}

gamesRouter.get("/", (request, response, next) => {
  void handleGetGames(request, response).catch(next);
});

gamesRouter.post("/", (request, response, next) => {
  void handlePostGames(request, response).catch((error: unknown) => {
    handleGameActionError(error, response, next);
  });
});

gamesRouter.get("/:id/state", (request, response, next) => {
  void handleGetGameState(request, response).catch((error: unknown) => {
    handleGameActionError(error, response, next);
  });
});

gamesRouter.post("/:id/play-card", (request, response, next) => {
  void handlePostPlayCard(request, response).catch((error: unknown) => {
    handleGameActionError(error, response, next);
  });
});

gamesRouter.post("/:id/pass-cards", (request, response, next) => {
  void handlePostPassCards(request, response).catch((error: unknown) => {
    handleGameActionError(error, response, next);
  });
});

gamesRouter.post("/:id/leave", (request, response, next) => {
  void handlePostLeaveGame(request, response).catch((error: unknown) => {
    handleGameActionError(error, response, next);
  });
});

gamesRouter.get("/:id", (request: Request, response: Response) => {
  if (!request.session.user) {
    response.redirect("/auth/login");
    return;
  }

  const gameId = request.params.id;

  response.render("game", {
    title: "Game",
    gameId,
    user: request.session.user,
    error: null,
  });
});

function handleGameActionError(
  error: unknown,
  response: Response,
  next: (error: unknown) => void,
): void {
  if (error instanceof GameActionError) {
    response.status(error.statusCode).json({
      error: error.message,
    });
    return;
  }

  next(error);
}

function parseGameCardIds(value: unknown): number[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const ids = value.map((item) => Number(item));

  return ids.every((id) => Number.isInteger(id)) ? ids : null;
}
