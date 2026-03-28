// TODO [Person 2]:
import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";

import { create, existing, findByEmail } from "../db/users.js";
import type { LoginRequestBody, RegisterRequestBody } from "../types/types.js";

export const authRouter = Router();

const SALT_ROUNDS = 10;

authRouter.get("/register", (_request: Request, response: Response) => {
  response.status(200).json({
    message: "Register endpoint ready. Send a POST request to register a user.",
  });
});

authRouter.post("/register", (request: Request, response: Response) => {
  void (async (): Promise<void> => {
    try {
      const { email, password, display_name } = request.body as RegisterRequestBody;

      if (!email || !password || !display_name) {
        response.status(400).json({
          error: "Email, password, and display_name are required.",
        });
        return;
      }

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedDisplayName = display_name.trim();

      if (!trimmedEmail || !password || !trimmedDisplayName) {
        response.status(400).json({
          error: "Email, password, and display_name are required.",
        });
        return;
      }

      const userAlreadyExists = await existing(trimmedEmail);

      if (userAlreadyExists) {
        response.status(400).json({
          error: "An account with that email already exists.",
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const createdUser = await create(trimmedEmail, passwordHash, trimmedDisplayName);

      request.session.user = {
        id: createdUser.id,
        email: createdUser.email,
        display_name: createdUser.display_name,
      };

      response.status(201).json({
        message: "Registration successful.",
        user: request.session.user,
      });
    } catch (error) {
      console.error("Error during registration:", error);

      response.status(500).json({
        error: "Internal server error.",
      });
    }
  })();
});

authRouter.get("/login", (_request: Request, response: Response) => {
  response.status(200).json({
    message: "Login endpoint ready. Send a POST request to log in.",
  });
});

authRouter.post("/login", (request: Request, response: Response) => {
  void (async (): Promise<void> => {
    try {
      const { email, password } = request.body as LoginRequestBody;

      if (!email || !password) {
        response.status(400).json({
          error: "Email and password are required.",
        });
        return;
      }

      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedEmail || !password) {
        response.status(400).json({
          error: "Email and password are required.",
        });
        return;
      }

      const foundUser = await findByEmail(trimmedEmail);

      if (!foundUser) {
        response.status(401).json({
          error: "Invalid email or password.",
        });
        return;
      }

      const passwordMatches = await bcrypt.compare(password, foundUser.password_hash);

      if (!passwordMatches) {
        response.status(401).json({
          error: "Invalid email or password.",
        });
        return;
      }

      request.session.user = {
        id: foundUser.id,
        email: foundUser.email,
        display_name: foundUser.display_name,
      };

      response.status(200).json({
        message: "Login successful.",
        user: request.session.user,
      });
    } catch (error) {
      console.error("Error during login:", error);

      response.status(500).json({
        error: "Internal server error.",
      });
    }
  })();
});

authRouter.post("/logout", (request: Request, response: Response) => {
  request.session.destroy((error) => {
    if (error) {
      console.error("Error during logout:", error);

      response.status(500).json({
        error: "Unable to log out.",
      });
      return;
    }

    response.clearCookie("connect.sid");

    response.status(200).json({
      message: "Logout successful.",
    });
  });
});

authRouter.get("/me", (request: Request, response: Response) => {
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
