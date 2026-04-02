import type { NextFunction, Request, Response } from "express";
import { wantsJson } from "../utils/http.js";

export function requireAuth(request: Request, response: Response, next: NextFunction): void {
  if (request.session.user) {
    next();
    return;
  }

  if (wantsJson(request)) {
    response.status(401).json({ error: "Not authenticated." });
    return;
  }

  response.redirect("/auth/login");
}
