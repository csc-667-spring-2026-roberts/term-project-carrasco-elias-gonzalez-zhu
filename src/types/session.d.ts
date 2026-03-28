// TODO [Person 2]: optionally only if needed for the auth/session contract you freeze
import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      email: string;
      display_name: string;
    };
  }
}

export {};
