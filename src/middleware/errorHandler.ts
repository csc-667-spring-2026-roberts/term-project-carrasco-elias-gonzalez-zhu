import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("Unhandled error:", err);

  const message =
    env.nodeEnv === "development"
      ? err instanceof Error
        ? err.message
        : String(err)
      : "Internal Server Error";

  res.status(500).json({ error: message });
}
