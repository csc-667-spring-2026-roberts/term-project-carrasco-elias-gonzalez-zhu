// TODO [Person 2]:
// Preserve these auth route contracts exactly:
// - GET /auth/register
// - POST /auth/register
// - GET /auth/login
// - POST /auth/login
// - POST /auth/logout
// - GET /auth/me
//
// Preserve these request field names exactly:
// - email
// - password
// - display_name
//
// Preserve these browser flow expectations exactly:
// - GET /auth/register renders "auth/register"
// - GET /auth/login renders "auth/login"
// - successful register redirects to /lobby
// - successful login redirects to /lobby
// - logout redirects to /auth/login
// - GET /auth/me returns the current authenticated user or 401
//
// Person 2 is responsible for replacing the temporary stub behavior
// with real auth logic using:
// - src/db/users.ts
// - bcrypt
// - request.session.user
//
// Do NOT rename the routes, request fields, or exported router.

import { Router, type Request, type Response } from "express";

export const authRouter = Router();

authRouter.get("/register", (_request: Request, response: Response) => {
  // TODO [Person 2]:
  // Keep this route as GET /auth/register.
  // For final implementation, render the register page and pass
  // any view data needed by the template.
  response.render("auth/register", {
    title: "Register",
    user: null,
    error: undefined,
  });
});

authRouter.post("/register", (request: Request, response: Response) => {
  // TODO [Person 2]:
  // Replace this temporary browser-flow stub with real registration logic.
  //
  // Final expected behavior:
  // - read email, password, and display_name from request.body
  // - validate required fields
  // - normalize email (trim + lowercase)
  // - trim display_name
  // - reject duplicate email using src/db/users.ts
  // - hash password with bcrypt
  // - create user in the database
  // - store safe user data in request.session.user
  // - redirect to /lobby on success
  //
  // Do NOT change the request field names:
  // - email
  // - password
  // - display_name
  //
  // Do NOT change the success destination:
  // - /lobby
  const { email, display_name } = request.body as {
    email?: string;
    display_name?: string;
  };

  request.session.user = {
    id: 1,
    email: email?.trim().toLowerCase() || "test@example.com",
    display_name: display_name?.trim() || "Test User",
  };

  response.redirect("/lobby");
});

authRouter.get("/login", (_request: Request, response: Response) => {
  // TODO [Person 2]:
  // Keep this route as GET /auth/login.
  // For final implementation, render the login page and pass
  // any view data needed by the template.
  response.render("auth/login", {
    title: "Login",
    user: null,
    error: undefined,
  });
});

authRouter.post("/login", (request: Request, response: Response) => {
  // TODO [Person 2]:
  // Replace this temporary browser-flow stub with real login logic.
  //
  // Final expected behavior:
  // - read email and password from request.body
  // - validate required fields
  // - normalize email (trim + lowercase)
  // - find user by email using src/db/users.ts
  // - compare password with bcrypt
  // - reject invalid credentials
  // - store safe user data in request.session.user
  // - redirect to /lobby on success
  //
  // Do NOT change the request field names:
  // - email
  // - password
  //
  // Do NOT change the success destination:
  // - /lobby
  const { email } = request.body as {
    email?: string;
  };

  request.session.user = {
    id: 1,
    email: email?.trim().toLowerCase() || "test@example.com",
    display_name: "Test User",
  };

  response.redirect("/lobby");
});

authRouter.post("/logout", (request: Request, response: Response) => {
  // TODO [Person 2]:
  // Replace this temporary browser-flow stub with real logout logic.
  //
  // Final expected behavior:
  // - destroy the session
  // - clear the "connect.sid" cookie
  // - redirect to /auth/login
  //
  // Do NOT change the route path:
  // - POST /auth/logout
  //
  // Do NOT change the logout destination:
  // - /auth/login
  request.session.destroy(() => {
    response.clearCookie("connect.sid");
    response.redirect("/auth/login");
  });
});

authRouter.get("/me", (request: Request, response: Response) => {
  // TODO [Person 2]:
  // Preserve this route as GET /auth/me.
  //
  // Final expected behavior:
  // - if request.session.user does not exist, return 401
  // - otherwise return the current authenticated user
  //
  // This route is mainly used for backend testing and verification.
  if (!request.session.user) {
    response.status(401).json({
      error: "Not authenticated.",
    });
    return;
  }

  response.status(200).json({
    user: request.session.user,
  });
});
