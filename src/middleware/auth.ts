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
// - otherwise → reject unauthenticated access
//
// Do NOT rename this function or change its signature.
// Do NOT change how it is imported or used in other routes.

import type { NextFunction, Request, Response } from "express";

export function requireAuth(_request: Request, _response: Response, next: NextFunction): void {
  // TODO [Person 2]:
  // Replace this temporary browser-flow stub with real auth protection logic.
  //
  // Final expected behavior:
  // - check request.session.user
  // - if not present:
  //     - redirect to /auth/login (browser flow)
  //     OR return 401 (API flow, depending on design decision)
  // - otherwise call next()

  next();
}
