import bcrypt from "bcrypt";
import { Router, type Request, type Response } from "express";

import * as users from "../db/users.js";
import type { User } from "../types/types.js";
import { wantsJson } from "../utils/http.js";

export const authRouter = Router();

const BCRYPT_ROUNDS = 10;

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

authRouter.get("/register", (_request: Request, response: Response) => {
  response.render("auth/register", {
    title: "Register",
    user: null,
    error: undefined,
  });
});

authRouter.post("/register", (request, response, next) => {
  void handlePostRegister(request, response).catch(next);
});

authRouter.get("/login", (_request: Request, response: Response) => {
  response.render("auth/login", {
    title: "Login",
    user: null,
    error: undefined,
  });
});

authRouter.post("/login", (request, response, next) => {
  void handlePostLogin(request, response).catch(next);
});

authRouter.post("/logout", (request: Request, response: Response) => {
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
  if (!request.session.user) {
    response.status(401).json({ error: "Not authenticated." });
    return;
  }

  response.status(200).json({
    user: request.session.user,
  });
});
