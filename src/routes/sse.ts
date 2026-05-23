import { Router, type Request, type Response } from "express";

import { requireAuth } from "../middleware/auth.js";
import {
  listGames,
  markGameUserConnected,
  markGameUserDisconnected,
  replaceDisconnectedUserWithBot,
  runBotsForGame,
  runHumanTimeoutAction,
} from "../db/games.js";

type SseClient = {
  id: number;
  gameId: number | null;
  userId: number;
  response: Response;
};

const BOT_TAKEOVER_GRACE_MS = 60_000;
const HUMAN_TURN_TIMEOUT_MS = envNumber("HUMAN_TURN_TIMEOUT_MS", 0);

const sseRouter = Router();

let nextClientId = 1;
const clients = new Map<number, SseClient>();
const gameClientCounts = new Map<string, number>();
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
const humanTurnTimers = new Map<number, { timer: ReturnType<typeof setTimeout>; token: number }>();
let nextHumanTurnTimerToken = 1;

export function broadcastSse(data: unknown): void {
  const message = `data: ${JSON.stringify(data)}\n\n`;

  for (const client of clients.values()) {
    client.response.write(message);
  }
}

export function clearHumanTurnTimeout(gameId: number): void {
  const existing = humanTurnTimers.get(gameId);

  if (existing) {
    clearTimeout(existing.timer);
    humanTurnTimers.delete(gameId);
  }
}

export function scheduleGameAutomation(gameId: number): void {
  clearHumanTurnTimeout(gameId);

  void runBotsForGame(gameId, (updatedGameId) => {
    broadcastSse({
      type: "game_updated",
      gameId: updatedGameId,
    });
  })
    .then(async () => {
      broadcastSse({
        type: "games_updated",
        games: await listGames(),
      });
      scheduleHumanTurnTimeout(gameId);
    })
    .catch((error: unknown) => {
      console.error("Error running game automation:", error);
      scheduleHumanTurnTimeout(gameId);
    });
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
  scheduleGameAutomation(gameId);
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

        scheduleGameAutomation(gameId);
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

function scheduleHumanTurnTimeout(gameId: number): void {
  clearHumanTurnTimeout(gameId);

  if (HUMAN_TURN_TIMEOUT_MS <= 0) {
    return;
  }

  const token = nextHumanTurnTimerToken;
  nextHumanTurnTimerToken += 1;

  const timer = setTimeout(() => {
    void handleHumanTurnTimeout(gameId, token);
  }, HUMAN_TURN_TIMEOUT_MS);

  humanTurnTimers.set(gameId, { timer, token });
}

async function handleHumanTurnTimeout(gameId: number, token: number): Promise<void> {
  const scheduled = humanTurnTimers.get(gameId);

  if (!scheduled || scheduled.token !== token) {
    return;
  }

  humanTurnTimers.delete(gameId);

  try {
    const acted = await runHumanTimeoutAction(gameId);

    if (!acted) {
      return;
    }

    broadcastSse({
      type: "game_updated",
      gameId,
    });

    scheduleGameAutomation(gameId);
  } catch (error: unknown) {
    console.error("Error running human turn timeout:", error);
  }
}

function envNumber(name: string, defaultValue: number): number {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue.trim() === "") {
    return defaultValue;
  }

  const value = Number(rawValue);

  return Number.isFinite(value) && value >= 0 ? value : defaultValue;
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
