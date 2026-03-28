// TODO [Person 2]:
// Preserve this middleware contract exactly:
// - export function requireAuth(request, response, next)
//
// Expected usage:
// - used in protected routes (e.g., /lobby)
// - called before route handler
//
// Expected final behavior:
// - if request.session.user exists → call next()
// - otherwise → redirect to /auth/login (browser flow)
//
// Do NOT rename this function or change its signature.
// Do NOT change how it is imported or used in other routes.

import type { NextFunction, Request, Response } from "express";

export function requireAuth(_request: Request, _response: Response, next: NextFunction): void {
  // TODO [Person 2]:
  // Temporary stub: always allow access.
  //
  // Replace with:
  // - check request.session.user
  // - if missing → redirect("/auth/login")
  // - otherwise → next()

  next();
}
