/**
 * Debug/testing routes.
 * Used for development and verification only.
 * Not part of core application functionality.
 */

import { Router, type Request, type Response } from "express";

export const testRouter = Router();

testRouter.get("/", (request: Request, response: Response) => {
  response.status(200).json({
    message: "Test route working",
    isAuthenticated: Boolean(request.session.user),
    user: request.session.user ?? null,
  });
});
