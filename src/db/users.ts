import db from "./connection.js";
import type { DbUser, User } from "../types/types.js";

export async function existing(email: string): Promise<boolean> {
  const found = await db.oneOrNone<{ id: number }>(
    `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
    `,
    [email],
  );

  return found !== null;
}

export async function create(
  email: string,
  passwordHash: string,
  displayName: string,
  avatarEmoji: string | null,
): Promise<User> {
  return db.one<User>(
    `
      INSERT INTO users (email, password_hash, display_name, avatar_emoji)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, display_name, avatar_emoji, created_at
    `,
    [email, passwordHash, displayName, avatarEmoji],
  );
}

export async function findByEmail(email: string): Promise<DbUser | null> {
  return db.oneOrNone<DbUser>(
    `
      SELECT id, email, password_hash, display_name, avatar_emoji, created_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
    `,
    [email],
  );
}
