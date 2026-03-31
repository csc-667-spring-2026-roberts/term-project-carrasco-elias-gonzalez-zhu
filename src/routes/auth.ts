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

import bcrypt from "bcrypt";
import { Router, type NextFunction, type Request, type Response } from "express";

import * as users from "../db/users.js";
import type { User } from "../types/types.js";

export const authRouter = Router();

const BCRYPT_ROUNDS = 10;

function wantsJson(request: Request): boolean {
  return Boolean(request.is("application/json") || request.accepts("json"));
}

function toSessionUser(user: Pick<User, "id" | "email" | "display_name">): {
  id: number;
  email: string;
  display_name: string;
} {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
  };
}

function jsonUser(user: User): { id: number; email: string; display_name: string } {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
  };
}

async function handlePostRegister(request: Request, response: Response): Promise<void> {
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
  const { email, password, display_name } = request.body as {
    email?: string;
    password?: string;
    display_name?: string;
  };

  const emailTrimmed = typeof email === "string" ? email.trim() : "";
  const passwordRaw = typeof password === "string" ? password : "";
  const displayTrimmed = typeof display_name === "string" ? display_name.trim() : "";
  const emailNormalized = emailTrimmed.toLowerCase();

  if (!emailNormalized || !passwordRaw || !displayTrimmed) {
    if (wantsJson(request)) {
      response.status(400).json({ error: "Email, password, and display name are required." });
      return;
    }
    response.status(400).render("auth/register", {
      title: "Register",
      user: request.session.user ?? null,
      error: "Email, password, and display name are required.",
    });
    return;
  }

  const duplicate = await users.existing(emailNormalized);
  if (duplicate) {
    if (wantsJson(request)) {
      response.status(400).json({ error: "An account with that email already exists." });
      return;
    }
    response.status(400).render("auth/register", {
      title: "Register",
      user: request.session.user ?? null,
      error: "An account with that email already exists.",
    });
    return;
  }

  const passwordHash = await bcrypt.hash(passwordRaw, BCRYPT_ROUNDS);
  const user = await users.create(emailNormalized, passwordHash, displayTrimmed);
  request.session.user = toSessionUser(user);

  if (wantsJson(request)) {
    response.status(201).json({
      message: "Registration successful.",
      user: jsonUser(user),
    });
    return;
  }

  response.redirect("/lobby");
}

async function handlePostLogin(request: Request, response: Response): Promise<void> {
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
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  const emailTrimmed = typeof email === "string" ? email.trim() : "";
  const passwordRaw = typeof password === "string" ? password : "";
  const emailNormalized = emailTrimmed.toLowerCase();

  if (!emailNormalized || !passwordRaw) {
    if (wantsJson(request)) {
      response.status(400).json({ error: "Email and password are required." });
      return;
    }
    response.status(400).render("auth/login", {
      title: "Login",
      user: request.session.user ?? null,
      error: "Email and password are required.",
    });
    return;
  }

  const row = await users.findByEmail(emailNormalized);
  const valid = row !== null && (await bcrypt.compare(passwordRaw, row.password_hash));

  if (!valid) {
    if (wantsJson(request)) {
      response.status(401).json({ error: "Invalid email or password." });
      return;
    }
    response.status(401).render("auth/login", {
      title: "Login",
      user: request.session.user ?? null,
      error: "Invalid email or password.",
    });
    return;
  }

  request.session.user = toSessionUser(row);

  if (wantsJson(request)) {
    response.status(200).json({
      message: "Login successful.",
      user: jsonUser(row),
    });
    return;
  }

  response.redirect("/lobby");
}

authRouter.get("/register", (request: Request, response: Response) => {
  // TODO [Person 2]:
  // Keep this route as GET /auth/register.
  // For final implementation, render the register page and pass
  // any view data needed by the template.
  response.render("auth/register", {
    title: "Register",
    user: request.session.user ?? null,
    error: undefined,
  });
});

authRouter.post("/register", (request: Request, response: Response, next: NextFunction) => {
  void handlePostRegister(request, response).catch(next);
});

authRouter.get("/login", (request: Request, response: Response) => {
  // TODO [Person 2]:
  // Keep this route as GET /auth/login.
  // For final implementation, render the login page and pass
  // any view data needed by the template.
  response.render("auth/login", {
    title: "Login",
    user: request.session.user ?? null,
    error: undefined,
  });
});

authRouter.post("/login", (request: Request, response: Response, next: NextFunction) => {
  void handlePostLogin(request, response).catch(next);
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
  request.session.destroy((err: unknown) => {
    if (err) {
      if (wantsJson(request)) {
        response.status(500).json({ error: "Unable to log out." });
        return;
      }
      response.status(500).send("Unable to log out.");
      return;
    }

    response.clearCookie("connect.sid");

    if (wantsJson(request)) {
      response.status(200).json({ message: "Logout successful." });
      return;
    }

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
