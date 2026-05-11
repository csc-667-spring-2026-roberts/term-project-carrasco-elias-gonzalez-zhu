import { Router, type Request, type Response } from "express";

import { requireAuth } from "../middleware/auth.js";

type SseClient = {
  id: number;
  response: Response;
};

const sseRouter = Router();

let nextClientId = 1;
const clients = new Map<number, SseClient>();

export function broadcastSse(data: unknown): void {
  const message = `data: ${JSON.stringify(data)}\n\n`;

  for (const client of clients.values()) {
    client.response.write(message);
  }
}

sseRouter.get("/", requireAuth, (request: Request, response: Response) => {
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
    response,
  });

  console.log(`SSE client ${String(clientId)} connected. Active clients: ${String(clients.size)}`);

  request.on("close", () => {
    clients.delete(clientId);
    console.log(
      `SSE client ${String(clientId)} disconnected. Active clients: ${String(clients.size)}`,
    );
  });
});

export default sseRouter;
