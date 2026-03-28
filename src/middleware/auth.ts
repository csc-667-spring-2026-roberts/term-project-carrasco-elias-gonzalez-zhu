// TODO [Person 2]:
import type { NextFunction, Request, Response } from "express";

export function requireAuth(request: Request, response: Response, next: NextFunction): void {
  if (!request.session.user) {
    response.status(401).json({
      error: "Authentication required.",
    });
    return;
  }

  next();
}
