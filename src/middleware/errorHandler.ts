import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("Unhandled error:", err);

  const message =
    process.env.NODE_ENV === "development"
      ? err instanceof Error
        ? err.message
        : String(err)
      : "Internal Server Error";

  res.status(500).json({ error: message });
}
