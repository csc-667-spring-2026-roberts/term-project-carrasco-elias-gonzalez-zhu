import express from "express";
import type { Express } from "express";

import { paths } from "./config/paths.js";
import { rootRouter } from "./routes/root.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { gamesRouter } from "./routes/games.routes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp(): Express {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static file serving
  app.use(express.static(paths.publicDir));

  // Routes
  app.use(rootRouter);
  app.use(healthRouter);
  app.use("/api/games", gamesRouter);

  // 404 + error handler (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
