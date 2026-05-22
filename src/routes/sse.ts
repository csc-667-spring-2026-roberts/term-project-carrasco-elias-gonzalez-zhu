import { Router, type Request, type Response } from "express";

import { requireAuth } from "../middleware/auth.js";
import {
  listGames,
  markGameUserConnected,
  markGameUserDisconnected,
  replaceDisconnectedUserWithBot,
} from "../db/games.js";

type SseClient = {
  id: number;
  gameId: number | null;
  userId: number;
  response: Response;
};

const BOT_TAKEOVER_GRACE_MS = 60_000;

const sseRouter = Router();

let nextClientId = 1;
const clients = new Map<number, SseClient>();
const gameClientCounts = new Map<string, number>();
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function broadcastSse(data: unknown): void {
  const message = `data: ${JSON.stringify(data)}\n\n`;

  for (const client of clients.values()) {
    client.response.write(message);
  }
}

sseRouter.get("/", requireAuth, (request: Request, response: Response) => {
  const userId = request.session.user?.id;

  if (!userId) {
    response.status(401).json({ error: "Not authenticated." });
    return;
  }

  const gameId = parseGameId(request);

  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  response.write(": connected\n\n");

  const clientId = nextClientId;
  nextClientId += 1;

  clients.set(clientId, {
    id: clientId,
    gameId,
    userId,
    response,
  });

  if (gameId !== null) {
    void handleGameSseConnected(gameId, userId);
  }

  console.log(`SSE client ${String(clientId)} connected. Active clients: ${String(clients.size)}`);

  request.on("close", () => {
    const client = clients.get(clientId);

    clients.delete(clientId);

    if (client?.gameId !== null && client?.gameId !== undefined) {
      void handleGameSseClosed(client.gameId, client.userId);
    }

    console.log(
      `SSE client ${String(clientId)} disconnected. Active clients: ${String(clients.size)}`,
    );
  });
});

async function handleGameSseConnected(gameId: number, userId: number): Promise<void> {
  const key = gameUserKey(gameId, userId);
  const timer = disconnectTimers.get(key);

  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(key);
  }

  gameClientCounts.set(key, (gameClientCounts.get(key) ?? 0) + 1);
  await markGameUserConnected(gameId, userId);
}

async function handleGameSseClosed(gameId: number, userId: number): Promise<void> {
  const key = gameUserKey(gameId, userId);
  const openCount = Math.max((gameClientCounts.get(key) ?? 1) - 1, 0);

  if (openCount > 0) {
    gameClientCounts.set(key, openCount);
    return;
  }

  gameClientCounts.delete(key);
  await markGameUserDisconnected(gameId, userId);
  scheduleBotTakeover(gameId, userId);
}

function scheduleBotTakeover(gameId: number, userId: number): void {
  const key = gameUserKey(gameId, userId);
  const existingTimer = disconnectTimers.get(key);

  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    disconnectTimers.delete(key);
    void replaceDisconnectedUserWithBot(gameId, userId)
      .then(async (converted) => {
        if (!converted) {
          return;
        }

        broadcastSse({
          type: "game_updated",
          gameId,
        });

        broadcastSse({
          type: "games_updated",
          games: await listGames(),
        });
      })
      .catch((error: unknown) => {
        console.error("Error replacing disconnected player with bot:", error);
      });
  }, BOT_TAKEOVER_GRACE_MS);

  disconnectTimers.set(key, timer);
}

function gameUserKey(gameId: number, userId: number): string {
  return `${String(gameId)}:${String(userId)}`;
}

function parseGameId(request: Request): number | null {
  const value = request.query.gameId;

  if (typeof value !== "string") {
    return null;
  }

  const gameId = Number(value);

  return Number.isInteger(gameId) ? gameId : null;
}

export default sseRouter;
