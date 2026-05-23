import bcrypt from "bcrypt";
import { Router, type Request, type Response } from "express";

import * as users from "../db/users.js";
import type { User } from "../types/types.js";
import { wantsJson } from "../utils/http.js";

export const authRouter = Router();

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const AVATAR_OPTIONS = ["😎", "🤖", "👑", "🐸", "🦊", "🐱", "🐼", "🦁", "👻", "🐧", "🐵", "🦄"];
const AVATAR_MAX_LENGTH = 16;

function toSessionUser(user: Pick<User, "id" | "email" | "display_name" | "avatar_emoji">): {
  id: number;
  email: string;
  display_name: string;
  avatar_emoji: string | null;
} {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    avatar_emoji: user.avatar_emoji,
  };
}

function jsonUser(user: User): {
  id: number;
  email: string;
  display_name: string;
  avatar_emoji: string | null;
} {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    avatar_emoji: user.avatar_emoji,
  };
}

async function handlePostRegister(request: Request, response: Response): Promise<void> {
  const { email, password, display_name, avatar_emoji } = request.body as {
    email?: string;
    password?: string;
    display_name?: string;
    avatar_emoji?: string;
  };

  const emailTrimmed = typeof email === "string" ? email.trim() : "";
  const passwordRaw = typeof password === "string" ? password : "";
  const displayTrimmed = typeof display_name === "string" ? display_name.trim() : "";
  const avatar = parseAvatarEmoji(avatar_emoji);
  const avatarEmoji = avatar.value;
  const emailNormalized = emailTrimmed.toLowerCase();

  if (!emailNormalized || !passwordRaw || !displayTrimmed) {
    respondRegisterError(
      request,
      response,
      400,
      "Email, password, and display name are required.",
      {
        selectedAvatar: avatarEmoji,
      },
    );
    return;
  }

  if (avatar.error) {
    respondRegisterError(request, response, 400, "Choose one of the preset avatar emojis.", {
      selectedAvatar: avatarEmoji,
    });
    return;
  }

  const duplicate = await users.existing(emailNormalized);

  if (duplicate) {
    respondRegisterError(request, response, 400, "An account with that email already exists.", {
      selectedAvatar: avatarEmoji,
    });
    return;
  }

  const passwordHash = await bcrypt.hash(passwordRaw, BCRYPT_ROUNDS);
  const user = await users.create(emailNormalized, passwordHash, displayTrimmed, avatarEmoji);

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
    avatarOptions: AVATAR_OPTIONS,
    selectedAvatar: null,
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

function parseAvatarEmoji(value: unknown): { value: string | null; error: boolean } {
  if (typeof value !== "string") {
    return { value: null, error: false };
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { value: null, error: false };
  }

  if (trimmed.length > AVATAR_MAX_LENGTH || !AVATAR_OPTIONS.includes(trimmed)) {
    return { value: trimmed, error: true };
  }

  return { value: trimmed, error: false };
}

function respondRegisterError(
  request: Request,
  response: Response,
  status: number,
  error: string,
  options: { selectedAvatar: string | null },
): void {
  if (wantsJson(request)) {
    response.status(status).json({ error });
    return;
  }

  response.status(status).render("auth/register", {
    title: "Register",
    user: request.session.user ?? null,
    avatarOptions: AVATAR_OPTIONS,
    selectedAvatar: options.selectedAvatar,
    error,
  });
}
